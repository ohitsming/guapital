import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // Adjust this value in production (0.1 = 10% of transactions)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set the environment
  environment: process.env.NODE_ENV,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  // Filter out sensitive data from edge runtime (middleware)
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Filter rate limit attempts (may contain IP addresses in logs)
    const error = hint.originalException;
    if (error instanceof Error && error.message.includes('Rate limit')) {
      // Log rate limit errors but remove PII
      event.user = undefined;
    }

    return event;
  },

  // Only enable in production or when explicitly testing
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
});
