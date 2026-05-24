'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Last-resort error boundary — catches errors in the root layout itself.
// Must include its own <html> + <body> because the layout has crashed.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '4rem 1rem',
          textAlign: 'center',
          backgroundColor: '#0a0a0a',
          color: '#e5e5e5',
          minHeight: '100vh',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#9ca3af',
              marginBottom: 8,
            }}
          >
            pm-os crashed
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
            Something broke at the root.
          </h1>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>
            Your data is safe — it&apos;s stored locally in IndexedDB. Reload to recover.
          </p>
          {error.digest && (
            <p
              style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', marginBottom: 20 }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 18px',
              fontSize: 14,
              backgroundColor: '#fff',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
