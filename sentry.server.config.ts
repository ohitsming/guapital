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

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from events
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Remove Plaid/Stripe secrets from context
    if (event.contexts) {
      delete event.contexts['Plaid Secret'];
      delete event.contexts['Stripe Secret'];
    }

    // Scrub sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          // Remove tokens, secrets, keys
          Object.keys(breadcrumb.data).forEach(key => {
            if (
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('key') ||
              key.toLowerCase().includes('password')
            ) {
              breadcrumb.data![key] = '[Filtered]';
            }
          });
        }
        return breadcrumb;
      });
    }

    // Filter out database connection errors (may contain connection strings)
    const error = hint.originalException;
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('connection')) {
        // Still log the error but sanitize the message
        event.message = 'Database connection error';
      }
    }

    return event;
  },

  // Only enable in production or when explicitly testing
  enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
});
