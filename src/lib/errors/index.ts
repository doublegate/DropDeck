/**
 * Error utilities for DropDeck
 * Sprint 5.5 - Error Handling and Offline Support
 */

/**
 * Base error class for DropDeck
 */
export class DropDeckError extends Error {
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DropDeckError';
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      isOperational: this.isOperational,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Network error (connection issues)
 */
export class NetworkError extends DropDeckError {
  constructor(message = 'Network connection error', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', true, context);
    this.name = 'NetworkError';
  }
}

/**
 * API error (server responded with error)
 */
export class ApiError extends DropDeckError {
  public readonly statusCode: number;
  public readonly response?: unknown;

  constructor(
    message: string,
    statusCode: number,
    response?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, `API_ERROR_${statusCode}`, true, context);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Authentication error
 */
export class AuthError extends DropDeckError {
  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', true, context);
    this.name = 'AuthError';
  }
}

/**
 * Platform connection error
 */
export class PlatformError extends DropDeckError {
  public readonly platform: string;

  constructor(
    platform: string,
    message = 'Platform connection error',
    context?: Record<string, unknown>
  ) {
    super(message, 'PLATFORM_ERROR', true, { ...context, platform });
    this.name = 'PlatformError';
    this.platform = platform;
  }
}

/**
 * Validation error
 */
export class ValidationError extends DropDeckError {
  public readonly errors: Record<string, string[]>;

  constructor(
    message: string,
    errors: Record<string, string[]>,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', true, context);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends DropDeckError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, context?: Record<string, unknown>) {
    super(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMIT_ERROR',
      true,
      context
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Offline error
 */
export class OfflineError extends DropDeckError {
  constructor(message = 'You appear to be offline', context?: Record<string, unknown>) {
    super(message, 'OFFLINE_ERROR', true, context);
    this.name = 'OfflineError';
  }
}

/**
 * Error codes for common scenarios
 */
export const ErrorCodes = {
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  OFFLINE_ERROR: 'OFFLINE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // Auth
  AUTH_ERROR: 'AUTH_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // API
  API_ERROR: 'API_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',

  // Platform
  PLATFORM_ERROR: 'PLATFORM_ERROR',
  PLATFORM_UNAVAILABLE: 'PLATFORM_UNAVAILABLE',
  PLATFORM_AUTH_FAILED: 'PLATFORM_AUTH_FAILED',

  // Data
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',

  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Get error severity based on error type
 */
export function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof OfflineError) return 'low';
  if (error instanceof NetworkError) return 'medium';
  if (error instanceof RateLimitError) return 'medium';
  if (error instanceof ValidationError) return 'low';
  if (error instanceof AuthError) return 'high';
  if (error instanceof PlatformError) return 'medium';
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) return 'high';
    if (error.statusCode === 401 || error.statusCode === 403) return 'high';
    return 'medium';
  }
  return 'medium';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof OfflineError) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }
  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (error instanceof RateLimitError) {
    return `Too many requests. Please wait ${error.retryAfter} seconds before trying again.`;
  }
  if (error instanceof AuthError) {
    return 'Your session has expired. Please sign in again.';
  }
  if (error instanceof PlatformError) {
    return `Unable to connect to ${error.platform}. Please try reconnecting.`;
  }
  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }
  if (error instanceof ApiError) {
    if (error.statusCode === 404) return 'The requested resource was not found.';
    if (error.statusCode >= 500) return 'Something went wrong on our end. Please try again later.';
    return error.message;
  }
  if (error instanceof DropDeckError) {
    return error.message;
  }

  // Generic error
  return 'Something went wrong. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof OfflineError) return true;
  if (error instanceof NetworkError) return true;
  if (error instanceof RateLimitError) return true;
  if (error instanceof ApiError) {
    // Retry 5xx errors and some 4xx errors
    return error.statusCode >= 500 || error.statusCode === 408 || error.statusCode === 429;
  }
  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Normalize any error to a DropDeckError
 */
export function normalizeError(error: unknown): DropDeckError {
  if (error instanceof DropDeckError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message);
    }
    if (error.message.includes('offline') || error.message.includes('network')) {
      return new OfflineError(error.message);
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return new AuthError(error.message);
    }

    return new DropDeckError(error.message, ErrorCodes.UNKNOWN_ERROR, true, {
      originalError: error.name,
    });
  }

  if (typeof error === 'string') {
    return new DropDeckError(error, ErrorCodes.UNKNOWN_ERROR);
  }

  return new DropDeckError('An unknown error occurred', ErrorCodes.UNKNOWN_ERROR);
}

/**
 * Log error with context (for debugging)
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const severity = getErrorSeverity(error);

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${timestamp}] [${severity.toUpperCase()}] ${error.name}:`, {
      message: error.message,
      stack: error.stack,
      ...(error instanceof DropDeckError && { code: error.code, context: error.context }),
      ...context,
    });
  } else {
    // In production, you might want to send to error tracking service
    console.error(`[${timestamp}] ${error.name}: ${error.message}`);
  }
}
