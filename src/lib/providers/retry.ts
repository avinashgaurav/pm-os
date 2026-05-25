import { AIError, classifyStatus, parseRetryAfter } from './errors';

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

interface RetryOptions {
  retries?: number; // total attempts including the first; default 3
  baseDelayMs?: number; // exponential backoff base; default 500ms
  maxDelayMs?: number; // cap on each backoff; default 8000ms
  signal?: AbortSignal;
  provider?: string;
  // Called once after a retry decision so callers can observe attempts in dev.
  onRetry?: (info: { attempt: number; delayMs: number; reason: string }) => void;
}

// Wait that respects an AbortSignal. Aborting fires the rejection immediately.
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AIError('aborted', 'Aborted'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AIError('aborted', 'Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// Wrap a `fetch` call in retry-with-backoff (exponential + jitter), honoring
// Retry-After on 429 and respecting an AbortSignal.
//
// Returns the final Response. On non-retryable HTTP error or exhausted retries,
// throws an AIError with the classified kind so callers can render tailored
// UX (e.g. "Rate limited — try again in 30s" vs "Auth failed — check key").
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const retries = Math.max(1, options.retries ?? 3);
  const baseDelay = options.baseDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 8000;
  const signal = options.signal;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw new AIError('aborted', 'Aborted');
    try {
      const res = await fetch(url, { ...init, signal });
      if (res.ok) return res;

      const status = res.status;
      const kind = classifyStatus(status);
      if (RETRYABLE_STATUSES.has(status) && attempt < retries) {
        const retryAfterMs = parseRetryAfter(res.headers.get('retry-after'));
        const backoff = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
        const jitter = Math.floor(Math.random() * baseDelay);
        const delay = Math.max(retryAfterMs ?? 0, backoff + jitter);
        options.onRetry?.({
          attempt,
          delayMs: delay,
          reason: status === 429 ? 'rate_limit' : `http_${status}`,
        });
        // Drain the body so the socket can be reused.
        await res.body?.cancel().catch(() => {});
        await sleep(delay, signal);
        continue;
      }

      // Non-retryable or final attempt — read body for the error message.
      const body = await res.json().catch(() => ({}));
      const upstreamMsg = (body as { error?: { message?: string } | string })?.error;
      const message =
        (typeof upstreamMsg === 'string' ? upstreamMsg : upstreamMsg?.message) ||
        `${options.provider ?? 'provider'} returned ${status}`;
      throw new AIError(kind, message, {
        status,
        provider: options.provider,
        retryAfterMs: parseRetryAfter(res.headers.get('retry-after')),
      });
    } catch (err) {
      if (err instanceof AIError) {
        if (err.kind === 'aborted') throw err;
        if (attempt >= retries) throw err;
        // Permanent (auth/model) — don't retry.
        if (err.kind === 'auth' || err.kind === 'model') throw err;
        lastErr = err;
        const delay = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
        options.onRetry?.({ attempt, delayMs: delay, reason: err.kind });
        await sleep(delay, signal);
        continue;
      }

      // Network error (fetch reject not from abort). Retry on transient.
      const isAbort = (err as { name?: string })?.name === 'AbortError' || signal?.aborted === true;
      if (isAbort) throw new AIError('aborted', 'Aborted');

      lastErr = err;
      if (attempt >= retries) {
        throw new AIError('network', 'Network error reaching provider', {
          provider: options.provider,
          cause: err,
        });
      }
      const delay = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
      options.onRetry?.({ attempt, delayMs: delay, reason: 'network' });
      await sleep(delay, signal);
    }
  }

  // Defensive — loop should always either return or throw above.
  throw lastErr instanceof Error
    ? lastErr
    : new AIError('server', 'Exhausted retries', { provider: options.provider });
}
