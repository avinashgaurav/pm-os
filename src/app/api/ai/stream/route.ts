import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getProvider, isValidProviderId } from '@/lib/providers';

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
    return NextResponse.json({ error: 'Provider not available' }, { status: 503 });
  }
  if (!p.generateStream) {
    return NextResponse.json({ error: 'Provider does not support streaming' }, { status: 501 });
  }

  const chosenModel = model && p.models.includes(model) ? model : p.defaultModel;

  // Forward the client's abort signal upstream so cancelling on the client
  // terminates the provider request rather than letting tokens keep flowing.
  const upstream = new AbortController();
  req.signal.addEventListener('abort', () => upstream.abort());

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of p.generateStream!({
          system,
          user,
          model: chosenModel,
          signal: upstream.signal,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        // If the client disconnected we don't need to report — it's expected.
        if (!upstream.signal.aborted) {
          const msg = err instanceof Error ? err.message : 'stream failed';
          Sentry.captureException(err, {
            tags: { area: 'ai-stream-route', provider: p.id, model: chosenModel },
          });
          // Surface the error to the client as a final tagged delta so the UI
          // can render the partial output and report what went wrong.
          controller.enqueue(encoder.encode(`\n\n[stream error: ${msg}]`));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-provider': p.id,
      'x-model': chosenModel,
    },
  });
}
