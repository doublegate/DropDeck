/**
 * Structured logging utility for DropDeck
 * Provides consistent log formatting and levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Unique request or operation identifier */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Service or component name */
  service?: string;
  /** Additional structured data */
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Get current log level from environment
 */
function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = getLogLevel();
const currentLevelValue = LOG_LEVELS[currentLevel];

/**
 * Format a log entry for output
 */
function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production (better for log aggregation)
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const timestamp = entry.timestamp.split('T')[1]?.slice(0, -1) ?? entry.timestamp;
  const level = entry.level.toUpperCase().padEnd(5);
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const error = entry.error ? `\n  Error: ${entry.error.message}` : '';

  return `[${timestamp}] ${level} ${entry.message}${context}${error}`;
}

/**
 * Write a log entry
 */
function writeLog(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (LOG_LEVELS[level] < currentLevelValue) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? { ...context } : undefined,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        }
      : undefined,
  };

  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Logger interface for type safety
 */
interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  child(defaultContext: LogContext): Logger;
}

/**
 * Logger instance with structured logging methods
 */
export const logger: Logger = {
  /**
   * Debug level - detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    writeLog('debug', message, context);
  },

  /**
   * Info level - general operational information
   */
  info(message: string, context?: LogContext): void {
    writeLog('info', message, context);
  },

  /**
   * Warn level - warning conditions
   */
  warn(message: string, context?: LogContext): void {
    writeLog('warn', message, context);
  },

  /**
   * Error level - error conditions
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : undefined;
    writeLog('error', message, context, err);
  },

  /**
   * Create a child logger with preset context
   */
  child(defaultContext: LogContext): Logger {
    return {
      debug: (message: string, context?: LogContext) =>
        logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        logger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: Error | unknown, context?: LogContext) =>
        logger.error(message, error, { ...defaultContext, ...context }),
      child: (childContext: LogContext) => logger.child({ ...defaultContext, ...childContext }),
    };
  },
};

/**
 * Log request timing
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context?: LogContext
): void {
  const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

  writeLog(level, `${method} ${path} ${statusCode} ${durationMs}ms`, {
    ...context,
    method,
    path,
    statusCode,
    durationMs,
  });
}

/**
 * Log database query timing
 */
export function logQuery(
  operation: string,
  table: string,
  durationMs: number,
  context?: LogContext
): void {
  logger.debug(`DB ${operation} on ${table} in ${durationMs}ms`, {
    ...context,
    operation,
    table,
    durationMs,
  });
}

/**
 * Log external service call
 */
export function logExternalCall(
  service: string,
  operation: string,
  durationMs: number,
  success: boolean,
  context?: LogContext
): void {
  const level: LogLevel = success ? 'info' : 'warn';
  const status = success ? 'succeeded' : 'failed';

  writeLog(level, `External call to ${service}.${operation} ${status} in ${durationMs}ms`, {
    ...context,
    service,
    operation,
    durationMs,
    success,
  });
}
