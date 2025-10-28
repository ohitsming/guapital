// sentry.client.config.ts
// This file configures Sentry for the browser/client side
// Next.js automatically loads this file when the app runs in the browser

import * as Sentry from '@sentry/nextjs';

// Debug log to verify this file is loading
console.log('[Sentry Client] sentry.client.config.ts is loading...');
console.log('[Sentry Client] DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Set' : 'Missing');
console.log('[Sentry Client] Enabled:', process.env.NEXT_PUBLIC_SENTRY_ENABLED);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production (0.1 = 10% of transactions)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set the environment
  environment: process.env.NODE_ENV,

  // Capture Replay for Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  integrations: [
    Sentry.replayIntegration({
      // Mask all text content, unmask specific elements if needed
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Filter out specific errors you don't want to track
    const error = hint.originalException;
    if (error instanceof Error) {
      // Ignore specific error messages
      const ignoreMessages = [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ];

      if (ignoreMessages.some(msg => error.message.includes(msg))) {
        return null;
      }
    }

    return event;
  },

  // Only enable in production or when explicitly testing
  // Note: Client-side needs NEXT_PUBLIC_ prefix to access env vars
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true',
});

console.log('[Sentry Client] Initialization complete. Enabled:',
  process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_ENABLED === 'true');
