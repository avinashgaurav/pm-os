import * as Sentry from '@sentry/nextjs';
import { getModulePrompt } from './ai-prompts';
import { AIError, parseRetryAfter, type AIErrorKind } from './providers/errors';
import { AIGenerateResponseSchema, ProvidersListResponseSchema } from './schemas';

export { AIError } from './providers/errors';
export type { AIErrorKind } from './providers/errors';

export interface ProviderSummary {
  id: string;
  label: string;
  models: string[];
  defaultModel: string;
  docs: string;
  configured: boolean;
}

export interface AIPreference {
  provider: string;
  model: string;
}

const PREF_KEY = 'pm-os-ai-pref';

export function getAIPreference(): AIPreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.provider === 'string' &&
      typeof parsed.model === 'string'
    ) {
      return { provider: parsed.provider, model: parsed.model };
    }
    return null;
  } catch {
    return null;
  }
}

export function setAIPreference(pref: AIPreference): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(pref));
}

export function hasAIPreference(): boolean {
  return !!getAIPreference();
}

export async function listProviders(): Promise<ProviderSummary[]> {
  const res = await fetch('/api/ai', { method: 'GET' });
  if (!res.ok) throw new Error('Failed to load providers');
  const data = await res.json();
  // Validate the response shape — Settings rendering depends on this.
  // Throw on failure so the Settings page's existing .catch handler shows a
  // user-visible error instead of an empty list that looks like "no providers".
  const parsed = ProvidersListResponseSchema.safeParse(data);
  if (!parsed.success) {
    Sentry.captureMessage('Invalid /api/ai providers response', {
      level: 'error',
      extra: { issues: parsed.error.issues.slice(0, 3) },
    });
    throw new Error('AI providers response did not match expected schema');
  }
  return parsed.data.providers;
}

export async function generateWithAI(
  systemPrompt: string,
  userPrompt: string,
  options?: { signal?: AbortSignal }
): Promise<string> {
  const pref = getAIPreference();
  if (!pref) {
    throw new Error('No AI provider selected. Open Settings to configure.');
  }

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
    body: JSON.stringify({
      provider: pref.provider,
      model: pref.model,
      system: systemPrompt,
      user: userPrompt,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw aiErrorFromResponse(res, data, pref.provider, 'ai');
  }
  // Validate the success shape. The route is in this same repo so a contract
  // break is a real bug — throw instead of swallowing it, so callers retry or
  // surface the failure to the user instead of silently treating it as an
  // empty AI response.
  const parsed = AIGenerateResponseSchema.safeParse(data);
  if (!parsed.success) {
    const err = new Error(`/api/ai response schema mismatch (provider: ${pref.provider})`);
    Sentry.captureException(err, {
      tags: { area: 'ai', provider: pref.provider },
      extra: { issues: parsed.error.issues.slice(0, 3) },
    });
    throw err;
  }
  return parsed.data.output || 'No output generated';
}

// Stream AI output as it generates. Calls `onDelta` for each text chunk.
// Resolves with the full concatenated output once the stream ends, or with
// the partial output if the caller aborts via the signal.
export async function generateStreamWithAI(
  systemPrompt: string,
  userPrompt: string,
  options: { signal?: AbortSignal; onDelta: (chunk: string, full: string) => void }
): Promise<string> {
  const pref = getAIPreference();
  if (!pref) {
    throw new Error('No AI provider selected. Open Settings to configure.');
  }

  let res: Response;
  try {
    res = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options.signal,
      body: JSON.stringify({
        provider: pref.provider,
        model: pref.model,
        system: systemPrompt,
        user: userPrompt,
      }),
    });
  } catch (err) {
    // fetch() rejects with AbortError if the signal fires before any response.
    if (isAbortError(err, options.signal)) return '';
    throw err;
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw aiErrorFromResponse(res, data, pref.provider, 'ai-stream');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        full += chunk;
        options.onDelta(chunk, full);
      }
    }
  } catch (err) {
    // Abort: return the partial. Server-side stream errors (controller.error)
    // surface here too — rethrow so the caller toasts the failure cleanly.
    if (!isAbortError(err, options.signal)) throw err;
  } finally {
    reader.releaseLock();
  }
  return full;
}

// Robust abort detection: DOMException name match where available, falling
// back to the consumed signal's `aborted` flag if the runtime throws a
// non-DOMException AbortError (older fetch implementations, undici quirks).
function isAbortError(err: unknown, signal?: AbortSignal): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError')
    return true;
  return !!signal?.aborted;
}

// Build an AIError from a failed API response. The route includes a `kind`
// field on error payloads (auth/rate_limit/model/server/...); we trust it but
// fall back to classifying off the HTTP status if the body is opaque.
function aiErrorFromResponse(
  res: Response,
  data: { error?: string; kind?: AIErrorKind },
  provider: string,
  sentryArea: string
): AIError {
  const kind: AIErrorKind =
    data?.kind ||
    (res.status === 401 || res.status === 403
      ? 'auth'
      : res.status === 429 || res.status === 408
        ? 'rate_limit'
        : res.status >= 500
          ? 'server'
          : 'model');
  const message = data?.error || `API error: ${res.status}`;
  const err = new AIError(kind, message, {
    status: res.status,
    provider,
    retryAfterMs: parseRetryAfter(res.headers.get('retry-after')),
  });
  // Only capture genuine failures; auth/rate-limit are expected UX states.
  if (kind === 'server' || kind === 'network') {
    Sentry.captureException(err, {
      tags: { area: sentryArea, provider, status: String(res.status), kind },
    });
  }
  return err;
}

export function buildModulePrompt(
  category: string,
  moduleSlug: string,
  outputName: string,
  title: string,
  sections: { label: string; value: string }[]
): { system: string; user: string } {
  const modulePrompt = getModulePrompt(category, moduleSlug);

  const system = `${modulePrompt.system}

Format rules:
- Use markdown: # for title, ## for sections, ### for subsections, - for bullets, **bold** for emphasis
- Start with a one-paragraph executive summary
- Be specific and actionable — no filler or generic advice
- End with prioritized next steps
- Write as a ready-to-share professional deliverable`;

  const filledSections = sections.filter((s) => s.value.trim());
  const sectionText = filledSections.map((s) => `### ${s.label}\n${s.value}`).join('\n\n');

  const user = `Generate a complete, professional ${outputName} titled "${title}" using the ${modulePrompt.methodology} framework.

Here is the information provided by the PM:

${sectionText}

Produce a comprehensive ${outputName} in markdown. Add your expert analysis, identify gaps, and provide actionable recommendations beyond what was provided.`;

  return { system, user };
}

export function buildAnalysisPrompt(
  category: string,
  moduleSlug: string,
  dataDescription: string
): { system: string; user: string } {
  const modulePrompt = getModulePrompt(category, moduleSlug);

  const system = `${modulePrompt.system}

You are reviewing existing data and providing expert analysis. Be specific, actionable, and reference the methodology. Use markdown formatting.`;

  const user = `Analyze the following data and provide expert recommendations using the ${modulePrompt.methodology} framework:

${dataDescription}

Provide:
1. Key observations and patterns
2. Gaps or risks identified
3. Specific, prioritized recommendations
4. Suggested next actions`;

  return { system, user };
}
