/**
 * Server-side logger utility for AWS Amplify + Sentry
 *
 * AWS Amplify captures stdout/stderr from Next.js server functions
 * These logs appear in CloudWatch under /aws/amplify/<app-id>
 *
 * Critical errors (error/fatal) are automatically sent to Sentry for alerting
 */

import { captureException, captureMessage } from './sentry';

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
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));
    // Send warnings to Sentry for monitoring
    captureMessage(message, 'warning', context);
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const actualError = errorOrContext instanceof Error ? errorOrContext : undefined;
    const actualContext = errorOrContext instanceof Error ? context : errorOrContext;

    // Log to CloudWatch
    console.error(this.formatLog('error', message, actualContext), actualError);

    // Send to Sentry for alerting
    if (actualError) {
      captureException(actualError, {
        message,
        ...actualContext,
      }, 'error');
    } else {
      captureMessage(message, 'error', actualContext);
    }
  }

  fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const actualError = errorOrContext instanceof Error ? errorOrContext : undefined;
    const actualContext = errorOrContext instanceof Error ? context : errorOrContext;

    // Log to CloudWatch
    console.error('FATAL:', this.formatLog('fatal', message, actualContext), actualError);

    // Send to Sentry with critical severity
    if (actualError) {
      captureException(actualError, {
        message,
        ...actualContext,
      }, 'fatal');
    } else {
      captureMessage(`FATAL: ${message}`, 'fatal', actualContext);
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
}

export const logger = new Logger();
