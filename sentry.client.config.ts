// Sentry — browser-side configuration.
// Loaded automatically by @sentry/nextjs in the client bundle.
// Set NEXT_PUBLIC_SENTRY_DSN in env to activate; no-ops if absent.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Conservative defaults — privacy-first for a local-first PM tool.
    sendDefaultPii: false,
    // No performance tracing or session replay on the client today.
    // Re-enable selectively if you need to debug specific flows.
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
