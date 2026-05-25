import { AIError, classifyStatus, parseRetryAfter } from './errors';

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

interface RetryOptions {
  // Total attempts, including the first. maxAttempts: 3 means up to 2 retries.
  // Clamped to >= 1 by the helper.
  maxAttempts?: number;
  baseDelayMs?: number; // exponential backoff base; default 500ms
  maxDelayMs?: number; // hard cap on each wait (after jitter); default 8000ms
  signal?: AbortSignal;
  provider?: string;
  // Called once after a retry decision so callers can observe attempts in dev.
  onRetry?: (info: { attempt: number; delayMs: number; reason: string }) => void;
}

// Wait that respects an AbortSignal. Aborting fires the rejection immediately.
// `{ once: true }` requires Node 18+ / modern browser AddEventListenerOptions
// support — both true on the runtimes this app targets.
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

// Detect abort from an unknown thrown value — duck-typed name match plus
// signal flag fallback for runtimes that throw non-DOMException AbortError.
function isAbort(err: unknown, signal?: AbortSignal): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true;
  if (err && typeof err === 'object' && (err as { name?: string }).name === 'AbortError')
    return true;
  return signal?.aborted === true;
}

// Compute the backoff for the next retry: exponential with full jitter, hard
// capped at maxDelay (applied AFTER jitter), then bumped up to honor Retry-After
// if the upstream asked for a longer wait.
function backoffDelay(attempt: number, base: number, cap: number, retryAfterMs?: number) {
  const exp = base * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * base);
  const withJitter = Math.min(cap, exp + jitter);
  return Math.max(retryAfterMs ?? 0, withJitter);
}

// Wrap a `fetch` call in retry-with-backoff, honoring Retry-After on 429 and
// respecting an AbortSignal. Returns the final Response on success. On a
// non-retryable HTTP error or exhausted retries, throws an AIError with the
// classified kind so callers can render tailored UX.
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const baseDelay = options.baseDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 8000;
  const signal = options.signal;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (signal?.aborted) throw new AIError('aborted', 'Aborted');

    let res: Response;
    try {
      res = await fetch(url, { ...init, signal });
    } catch (err) {
      // fetch() rejected: abort or network error.
      if (isAbort(err, signal)) throw new AIError('aborted', 'Aborted');
      if (attempt >= maxAttempts) {
        throw new AIError('network', 'Network error reaching provider', {
          provider: options.provider,
          cause: err,
        });
      }
      const delay = backoffDelay(attempt, baseDelay, maxDelay);
      options.onRetry?.({ attempt, delayMs: delay, reason: 'network' });
      await sleep(delay, signal);
      continue;
    }

    if (res.ok) return res;

    const status = res.status;
    const kind = classifyStatus(status);
    const retryAfterMs = parseRetryAfter(res.headers.get('retry-after'));

    // Retryable HTTP failure with attempts left → drain body, sleep, loop.
    if (RETRYABLE_STATUSES.has(status) && attempt < maxAttempts) {
      const delay = backoffDelay(attempt, baseDelay, maxDelay, retryAfterMs);
      options.onRetry?.({ attempt, delayMs: delay, reason: kind });
      await res.body?.cancel().catch(() => {});
      await sleep(delay, signal);
      continue;
    }

    // Non-retryable (auth / model / unmatched 4xx) OR final attempt exhausted.
    // Read upstream message for the AIError so callers get a useful toast.
    const body = await res.json().catch(() => ({}));
    const upstreamMsg = (body as { error?: { message?: string } | string })?.error;
    const message =
      (typeof upstreamMsg === 'string' ? upstreamMsg : upstreamMsg?.message) ||
      `${options.provider ?? 'provider'} returned ${status}`;
    throw new AIError(kind, message, {
      status,
      provider: options.provider,
      retryAfterMs,
    });
  }

  // Unreachable — the loop body either returns the Response or throws.
  /* c8 ignore next */
  throw new AIError('server', 'Exhausted retries', { provider: options.provider });
}
