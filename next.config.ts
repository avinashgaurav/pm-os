import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Server-side API routes (e.g. /api/ai) require a server runtime.
  // Netlify auto-detects Next.js and provisions functions for API routes.
};

// Sentry wrapper. No-ops when the env vars below are not set, so the
// build remains identical for local dev / Netlify deploys without Sentry.
// To activate source-map upload, set SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT
// in the host env. Runtime error capture is gated on SENTRY_DSN (server)
// and NEXT_PUBLIC_SENTRY_DSN (client) in the sentry.*.config.ts files.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  // Skip the whole plugin when no auth token is set — avoids build-time
  // noise for contributors without Sentry credentials.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
