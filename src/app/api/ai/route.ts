import { NextResponse } from 'next/server';
import { getProvider, isValidProviderId, listProviders } from '@/lib/providers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
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

  const p = getProvider(provider);
  if (!p.isConfigured()) {
    return NextResponse.json(
      { error: `${p.label} is not configured on this server. Set ${p.envVar} in env.` },
      { status: 503 }
    );
  }

  const chosenModel = model && p.models.includes(model) ? model : p.defaultModel;

  try {
    const output = await p.generate({ system, user, model: chosenModel });
    return NextResponse.json({ output, provider: p.id, model: chosenModel });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function GET() {
  const providers = listProviders().map((p) => ({
    id: p.id,
    label: p.label,
    models: p.models,
    defaultModel: p.defaultModel,
    envVar: p.envVar,
    docs: p.docs,
    configured: p.isConfigured(),
  }));
  return NextResponse.json({ providers });
}
