import * as Sentry from '@sentry/nextjs';

/**
 * Captures an exception and sends it to Sentry with optional context
 *
 * @param error - The error to capture
 * @param context - Additional context to include with the error
 * @param level - The severity level (default: 'error')
 */
export function captureException(
  error: unknown,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
) {
  if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
    console.error('Sentry (dev mode):', error, context);
    return;
  }

  Sentry.captureException(error, {
    level,
    ...(context && { contexts: { additional: context } }),
  });
}

/**
 * Captures a message and sends it to Sentry
 *
 * @param message - The message to capture
 * @param level - The severity level (default: 'info')
 * @param context - Additional context to include
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
    console.log('Sentry (dev mode):', message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    ...(context && { contexts: { additional: context } }),
  });
}

/**
 * Sets user context for Sentry events
 *
 * @param user - User information
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Adds a breadcrumb to track user actions
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Wraps an API route handler with error capture
 *
 * Usage:
 * ```ts
 * export const GET = withErrorHandler(async (request: Request) => {
 *   // Your handler logic
 * });
 * ```
 */
export function withSentryHandler<T extends (...args: any[]) => any>(
  handler: T,
  options?: {
    routeName?: string;
    captureBody?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Log the error to Sentry
      captureException(error, {
        route: options?.routeName || 'Unknown route',
        args: options?.captureBody ? args : undefined,
      });

      // Re-throw the error so it can be handled by the route
      throw error;
    }
  }) as T;
}

/**
 * Wraps a function with Sentry span tracking
 * Useful for tracking performance of specific operations
 *
 * Usage:
 * ```ts
 * const result = await withSentrySpan('sync-plaid', 'plaid.sync', async () => {
 *   return await syncPlaidAccounts();
 * });
 * ```
 */
export async function withSentrySpan<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan(
    {
      name,
      op: operation,
    },
    async () => {
      try {
        return await callback();
      } catch (error) {
        captureException(error, { operation: name });
        throw error;
      }
    }
  );
}
