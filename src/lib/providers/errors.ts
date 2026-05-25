// Tagged error class used across all providers and the API routes. The `kind`
// drives both retry decisions in `fetchWithRetry` and toast messaging in the
// editor.

export type AIErrorKind = 'network' | 'rate_limit' | 'auth' | 'model' | 'server' | 'aborted';

export class AIError extends Error {
  readonly kind: AIErrorKind;
  readonly status?: number;
  readonly provider?: string;
  readonly retryAfterMs?: number;

  constructor(
    kind: AIErrorKind,
    message: string,
    opts: { status?: number; provider?: string; retryAfterMs?: number; cause?: unknown } = {}
  ) {
    super(message, { cause: opts.cause });
    this.name = 'AIError';
    this.kind = kind;
    this.status = opts.status;
    this.provider = opts.provider;
    this.retryAfterMs = opts.retryAfterMs;
  }
}

// Classify an HTTP status into the right AIError kind. Used by every provider
// after the upstream call returns a non-OK response.
export function classifyStatus(status: number): AIErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 408 || status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'model';
}

// Pure helper to read & parse the Retry-After header per RFC 7231. Accepts
// either an integer seconds value or an HTTP-date. Returns ms, or undefined
// if the header is missing/unparseable.
export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const trimmed = header.trim();
  if (!trimmed) return undefined;
  // Integer seconds
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && asNumber >= 0) return Math.floor(asNumber * 1000);
  // HTTP-date
  const date = Date.parse(trimmed);
  if (!Number.isNaN(date)) {
    const delta = date - Date.now();
    return delta > 0 ? delta : 0;
  }
  return undefined;
}
