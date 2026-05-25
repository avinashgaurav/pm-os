import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getProvider, isValidProviderId } from '@/lib/providers';

export const runtime = 'nodejs';

const MAX_PROMPT_CHARS = 50_000;
const MAX_BODY_BYTES = 200_000;

let warnedNoToken = false;
function checkAuth(req: Request): boolean {
  const expected = process.env.PM_OS_API_TOKEN;
  if (!expected) {
    if (!warnedNoToken) {
      console.warn('[api/ai/stream] PM_OS_API_TOKEN not set — route is unauthenticated');
      warnedNoToken = true;
    }
    return true;
  }
  return req.headers.get('x-pm-os-token') === expected;
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Measure actual body size — header-only check trivially bypassed when the
  // client omits content-length.
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
    return NextResponse.json({ error: 'Provider not available' }, { status: 503 });
  }
  if (!p.generateStream) {
    return NextResponse.json({ error: 'Provider does not support streaming' }, { status: 501 });
  }

  const chosenModel = model && p.models.includes(model) ? model : p.defaultModel;
  const generateStream = p.generateStream;

  // Forward the client's abort signal upstream so cancelling on the client
  // terminates the provider request rather than letting tokens keep flowing.
  // Add a server-side timeout so runaway requests are bounded even if the
  // client disconnect signal doesn't propagate (some HTTP/2 + proxy topologies).
  const SERVER_TIMEOUT_MS = 60_000;
  const upstream = new AbortController();
  req.signal.addEventListener('abort', () => upstream.abort());
  const timeoutId = setTimeout(() => upstream.abort(), SERVER_TIMEOUT_MS);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of generateStream({
          system,
          user,
          model: chosenModel,
          signal: upstream.signal,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        // Close the stream uncleanly so the client's reader.read() rejects.
        // This keeps the error out of the user's saved output (vs emitting a
        // text chunk that gets concatenated into _output).
        if (!upstream.signal.aborted) {
          Sentry.captureException(err, {
            tags: { area: 'ai-stream-route', provider: p.id, model: chosenModel },
          });
        }
        controller.error(err);
      } finally {
        clearTimeout(timeoutId);
      }
    },
    cancel() {
      // Reader released — propagate to the provider request.
      upstream.abort();
      clearTimeout(timeoutId);
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
