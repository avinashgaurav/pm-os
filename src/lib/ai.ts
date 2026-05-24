import * as Sentry from '@sentry/nextjs';
import { getModulePrompt } from './ai-prompts';

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
  return data.providers;
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
    const err = new Error(data?.error || `API error: ${res.status}`);
    Sentry.captureException(err, {
      tags: { area: 'ai', provider: pref.provider, status: String(res.status) },
    });
    throw err;
  }
  return data.output || 'No output generated';
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
