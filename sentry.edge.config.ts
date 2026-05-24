// Sentry — Edge runtime configuration.
// Imported by instrumentation.ts when running in edge runtime.
// Set SENTRY_DSN in env to activate; no-ops if absent.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
