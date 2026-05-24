'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Something went wrong
        </p>
        <h2 className="text-xl font-semibold mb-3">This view crashed</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you were on hit an unexpected error. Your data is safe — it&apos;s stored locally
          in your browser. Try reloading the view.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-muted-foreground/60 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
