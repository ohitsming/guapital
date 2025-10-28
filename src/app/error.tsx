'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';
import { Button } from '@/components/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">
                Something went wrong
              </h1>
              <p className="text-lg text-gray-600">
                We&apos;ve been notified and are working on a fix.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={reset}
                className="w-full"
              >
                Try again
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="w-full"
              >
                Go to homepage
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 rounded-lg bg-red-50 p-4 text-left">
                <h3 className="mb-2 text-sm font-semibold text-red-800">
                  Error Details (Development Only)
                </h3>
                <pre className="overflow-auto text-xs text-red-700">
                  {error.message}
                </pre>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-600">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
