import type { Platform } from '@/types/platform';
import { AdapterErrorCode } from './types';

/**
 * Base error class for platform adapter errors
 */
export class PlatformAdapterError extends Error {
  public readonly platform: Platform;
  public readonly code: AdapterErrorCode;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly originalError?: Error;

  constructor(
    message: string,
    platform: Platform,
    code: AdapterErrorCode,
    options?: {
      retryable?: boolean;
      retryAfter?: number;
      originalError?: Error;
    }
  ) {
    super(message);
    this.name = 'PlatformAdapterError';
    this.platform = platform;
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.retryAfter = options?.retryAfter;
    this.originalError = options?.originalError;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error - token expired or invalid
 */
export class PlatformAuthError extends PlatformAdapterError {
  constructor(platform: Platform, message = 'Authentication failed', originalError?: Error) {
    super(message, platform, AdapterErrorCode.AUTH_ERROR, {
      retryable: false,
      originalError,
    });
    this.name = 'PlatformAuthError';
  }
}

/**
 * Rate limit error - too many requests
 */
export class PlatformRateLimitError extends PlatformAdapterError {
  constructor(platform: Platform, retryAfter: number, message?: string) {
    super(
      message ?? `Rate limited by ${platform}. Retry after ${retryAfter} seconds.`,
      platform,
      AdapterErrorCode.RATE_LIMITED,
      {
        retryable: true,
        retryAfter,
      }
    );
    this.name = 'PlatformRateLimitError';
  }
}

/**
 * Platform unavailable error - service is down
 */
export class PlatformUnavailableError extends PlatformAdapterError {
  constructor(platform: Platform, message?: string, originalError?: Error) {
    super(
      message ?? `${platform} service is currently unavailable`,
      platform,
      AdapterErrorCode.PLATFORM_UNAVAILABLE,
      {
        retryable: true,
        retryAfter: 30, // Retry after 30 seconds
        originalError,
      }
    );
    this.name = 'PlatformUnavailableError';
  }
}

/**
 * Data error - invalid or unexpected data from platform
 */
export class PlatformDataError extends PlatformAdapterError {
  public readonly rawData?: unknown;

  constructor(platform: Platform, message: string, rawData?: unknown) {
    super(message, platform, AdapterErrorCode.DATA_ERROR, {
      retryable: false,
    });
    this.name = 'PlatformDataError';
    this.rawData = rawData;
  }
}

/**
 * Network error - connection failed
 */
export class PlatformNetworkError extends PlatformAdapterError {
  constructor(platform: Platform, message?: string, originalError?: Error) {
    super(
      message ?? `Network error connecting to ${platform}`,
      platform,
      AdapterErrorCode.NETWORK_ERROR,
      {
        retryable: true,
        retryAfter: 5,
        originalError,
      }
    );
    this.name = 'PlatformNetworkError';
  }
}

/**
 * Webhook validation error - signature mismatch or invalid payload
 */
export class WebhookValidationError extends PlatformAdapterError {
  constructor(platform: Platform, message: string) {
    super(message, platform, AdapterErrorCode.WEBHOOK_INVALID, {
      retryable: false,
    });
    this.name = 'WebhookValidationError';
  }
}

/**
 * Check if an error is a platform adapter error
 */
export function isPlatformAdapterError(error: unknown): error is PlatformAdapterError {
  return error instanceof PlatformAdapterError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isPlatformAdapterError(error)) {
    return error.retryable;
  }
  return false;
}

/**
 * Get retry delay for an error
 */
export function getRetryDelay(error: unknown, attempt: number): number {
  if (isPlatformAdapterError(error) && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 16s)
  return Math.min(1000 * 2 ** attempt, 16000);
}
