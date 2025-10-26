import * as Sentry from '@sentry/nextjs';

/**
 * Server-side logger utility for AWS Amplify + Sentry
 *
 * AWS Amplify captures stdout/stderr from Next.js server functions
 * These logs appear in CloudWatch under /aws/amplify/<app-id>
 *
 * Also integrates with Sentry for error tracking and monitoring
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(context && { context }),
    };
    return JSON.stringify(logEntry);
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('info', message, context));

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, {
        level: 'info',
        contexts: { extra: context },
      });
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));

    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, {
        level: 'warning',
        contexts: { extra: context },
      });
    }
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const actualError = errorOrContext instanceof Error ? errorOrContext : undefined;
    const actualContext = errorOrContext instanceof Error ? context : errorOrContext;

    console.error(this.formatLog('error', message, actualContext), actualError);

    if (process.env.NODE_ENV === 'production') {
      if (actualError) {
        Sentry.captureException(actualError, {
          contexts: { extra: { message, ...actualContext } },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          contexts: { extra: actualContext },
        });
      }
    }
  }

  fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const actualError = errorOrContext instanceof Error ? errorOrContext : undefined;
    const actualContext = errorOrContext instanceof Error ? context : errorOrContext;

    console.error('FATAL:', this.formatLog('fatal', message, actualContext), actualError);

    if (process.env.NODE_ENV === 'production') {
      if (actualError) {
        Sentry.captureException(actualError, {
          level: 'fatal',
          contexts: { extra: { message, ...actualContext } },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'fatal',
          contexts: { extra: actualContext },
        });
      }
    }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatLog('debug', message, context));
    }
  }

  // Webhook-specific logging
  webhook(eventType: string, details: LogContext) {
    this.info(`Webhook Event: ${eventType}`, details);
  }

  /**
   * Set user context for Sentry
   */
  setUser(user: { id: string; email?: string; username?: string }) {
    Sentry.setUser(user);
  }

  /**
   * Clear user context
   */
  clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: any) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  /**
   * Set custom context
   */
  setContext(name: string, context: { [key: string]: any }) {
    Sentry.setContext(name, context);
  }
}

export const logger = new Logger();
