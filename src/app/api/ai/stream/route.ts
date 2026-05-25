import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getProvider, isValidProviderId } from '@/lib/providers';
import { AIError } from '@/lib/providers/errors';

export const runtime = 'nodejs';

const MAX_PROMPT_CHARS = 50_000;
const MAX_BODY_BYTES = 200_000;

function checkAuth(req: Request): boolean {
  const expected = process.env.PM_OS_API_TOKEN;
  if (!expected) {
    // Serverless isolates each get their own module scope, so a "warn once"
    // flag fires per cold start rather than truly once. Warn unconditionally —
    // a misconfigured deploy is worth seeing in every log line.
    console.warn('[api/ai/stream] PM_OS_API_TOKEN not set — route is unauthenticated');
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
    return NextResponse.json({ error: 'Provider not available', kind: 'auth' }, { status: 503 });
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

  // Pull the first chunk eagerly. If the upstream connect / first-byte fails,
  // we can return a proper HTTP error with classified status (so the client
  // can retry on rate-limit, surface auth issues, etc). Once the first chunk
  // is in hand we hand off to a ReadableStream; any subsequent error closes
  // the stream uncleanly via controller.error.
  const iterator = generateStream({
    system,
    user,
    model: chosenModel,
    signal: upstream.signal,
  })[Symbol.asyncIterator]();

  let firstResult: IteratorResult<string>;
  try {
    firstResult = await iterator.next();
  } catch (err) {
    clearTimeout(timeoutId);
    // Release any resources the iterator may have opened (provider response
    // body) before bailing.
    iterator.return?.().catch(() => {});
    return errorResponseFor(err, p.id, chosenModel);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!firstResult.done && firstResult.value) {
          controller.enqueue(encoder.encode(firstResult.value));
        }
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (value) controller.enqueue(encoder.encode(value));
        }
        controller.close();
      } catch (err) {
        // Mid-stream failure — close uncleanly so the client's reader rejects.
        if (!upstream.signal.aborted && !(err instanceof AIError && err.kind === 'aborted')) {
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
      upstream.abort();
      iterator.return?.().catch(() => {});
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

function statusForKind(kind: AIError['kind']): number {
  switch (kind) {
    case 'auth':
      return 401;
    case 'rate_limit':
      return 429;
    case 'model':
      return 400;
    case 'aborted':
      return 499;
    case 'network':
    case 'server':
    default:
      return 502;
  }
}

function errorResponseFor(err: unknown, providerId: string, modelId: string) {
  if (err instanceof AIError) {
    const status = statusForKind(err.kind);
    if (err.kind === 'server' || err.kind === 'network') {
      Sentry.captureException(err, {
        tags: { area: 'ai-stream-route', provider: providerId, model: modelId, kind: err.kind },
      });
    }
    const headers: Record<string, string> = {};
    if (err.kind === 'rate_limit' && err.retryAfterMs) {
      headers['retry-after'] = String(Math.ceil(err.retryAfterMs / 1000));
    }
    return NextResponse.json(
      { error: err.message, kind: err.kind, provider: providerId },
      { status, headers }
    );
  }
  const msg = err instanceof Error ? err.message : 'unknown';
  console.error(`[api/ai/stream] ${providerId} stream failed before first chunk:`, msg);
  Sentry.captureException(err, {
    tags: { area: 'ai-stream-route', provider: providerId, model: modelId },
  });
  return NextResponse.json({ error: 'AI generation failed', kind: 'server' }, { status: 502 });
}
