import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getProvider, isValidProviderId, listProviders } from '@/lib/providers';
import { AIError } from '@/lib/providers/errors';

export const runtime = 'nodejs';

const MAX_PROMPT_CHARS = 50_000;
const MAX_BODY_BYTES = 200_000;

function checkAuth(req: Request): boolean {
  const expected = process.env.PM_OS_API_TOKEN;
  if (!expected) {
    // Per-isolate "warn once" is unreliable in serverless — warn unconditionally
    // so a misconfigured deploy is visible in every log line.
    console.warn('[api/ai] PM_OS_API_TOKEN not set — route is unauthenticated');
    return true;
  }
  return req.headers.get('x-pm-os-token') === expected;
}

// Map AIError kinds to the HTTP status surfaced to the client, so the editor
// can distinguish 429 (rate-limited, retry later) from 401 (bad key) from 502
// (provider broken).
function statusForKind(kind: AIError['kind']): number {
  switch (kind) {
    case 'auth':
      return 401;
    case 'rate_limit':
      return 429;
    case 'model':
      return 400;
    case 'aborted':
      return 499; // RFC 9110 says no — but used widely for "client closed request"
    case 'network':
    case 'server':
    default:
      return 502;
  }
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let bodyBuf: ArrayBuffer;
  try {
    bodyBuf = await req.arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 });
  }
  if (bodyBuf.byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bodyBuf));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { provider, model, system, user } = (body ?? {}) as {
    provider?: string;
    model?: string;
    system?: string;
    user?: string;
  };

  if (!provider || !isValidProviderId(provider)) {
    return NextResponse.json({ error: 'Unknown or missing provider' }, { status: 400 });
  }
  if (typeof system !== 'string' || typeof user !== 'string') {
    return NextResponse.json({ error: 'system and user prompts required' }, { status: 400 });
  }
  if (system.length > MAX_PROMPT_CHARS || user.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Prompt too large (max ${MAX_PROMPT_CHARS} chars per field)` },
      { status: 413 }
    );
  }

  const p = getProvider(provider);
  if (!p.isConfigured()) {
    console.warn(`[api/ai] Provider ${p.id} requested but ${p.envVar} is not set`);
    return NextResponse.json({ error: 'Provider not available', kind: 'auth' }, { status: 503 });
  }

  const chosenModel = model && p.models.includes(model) ? model : p.defaultModel;

  try {
    const result = await p.generate({ system, user, model: chosenModel, signal: req.signal });
    return NextResponse.json({
      output: result.text,
      provider: p.id,
      model: chosenModel,
      usage: result.usage,
    });
  } catch (err) {
    if (err instanceof AIError) {
      const status = statusForKind(err.kind);
      // Only capture genuine server-side problems; rate-limit/auth are expected.
      if (err.kind === 'server' || err.kind === 'network') {
        Sentry.captureException(err, {
          tags: { area: 'ai-route', provider: p.id, model: chosenModel, kind: err.kind },
        });
      }
      const headers: Record<string, string> = {};
      if (err.retryAfterMs && err.kind === 'rate_limit') {
        headers['retry-after'] = String(Math.ceil(err.retryAfterMs / 1000));
      }
      return NextResponse.json(
        { error: err.message, kind: err.kind, provider: p.id },
        { status, headers }
      );
    }
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[api/ai] ${p.id} generation failed:`, msg);
    Sentry.captureException(err, {
      tags: { area: 'ai-route', provider: p.id, model: chosenModel },
    });
    return NextResponse.json({ error: 'AI generation failed', kind: 'server' }, { status: 502 });
  }
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providers = listProviders().map((p) => ({
    id: p.id,
    label: p.label,
    models: p.models,
    defaultModel: p.defaultModel,
    docs: p.docs,
    configured: p.isConfigured(),
  }));
  return NextResponse.json({ providers });
}
