import { NextResponse } from 'next/server';
import { getProvider, isValidProviderId, listProviders } from '@/lib/providers';

export const runtime = 'nodejs';

const MAX_PROMPT_CHARS = 50_000;
const MAX_BODY_BYTES = 200_000;

function checkAuth(req: Request): boolean {
  const expected = process.env.PM_OS_API_TOKEN;
  if (!expected) return true;
  return req.headers.get('x-pm-os-token') === expected;
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lenHeader = req.headers.get('content-length');
  if (lenHeader && Number(lenHeader) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
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
    return NextResponse.json({ error: 'Provider not available' }, { status: 503 });
  }

  const chosenModel = model && p.models.includes(model) ? model : p.defaultModel;

  try {
    const output = await p.generate({ system, user, model: chosenModel });
    return NextResponse.json({ output, provider: p.id, model: chosenModel });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[api/ai] ${p.id} generation failed:`, msg);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
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
