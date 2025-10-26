/**
 * Server-side logger utility for AWS Amplify
 *
 * AWS Amplify captures stdout/stderr from Next.js server functions
 * These logs appear in CloudWatch under /aws/amplify/<app-id>
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
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('warn', message, context));
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const actualError = errorOrContext instanceof Error ? errorOrContext : undefined;
    const actualContext = errorOrContext instanceof Error ? context : errorOrContext;

    console.error(this.formatLog('error', message, actualContext), actualError);
  }

  fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const actualError = errorOrContext instanceof Error ? errorOrContext : undefined;
    const actualContext = errorOrContext instanceof Error ? context : errorOrContext;

    console.error('FATAL:', this.formatLog('fatal', message, actualContext), actualError);
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
