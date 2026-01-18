/**
 * Error utilities tests
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DropDeckError,
  NetworkError,
  ApiError,
  AuthError,
  PlatformError,
  ValidationError,
  RateLimitError,
  OfflineError,
  ErrorCodes,
  getErrorSeverity,
  getUserFriendlyMessage,
  isRetryableError,
  getRetryDelay,
  normalizeError,
  logError,
} from '@/lib/errors';

describe('Error Classes', () => {
  describe('DropDeckError', () => {
    it('creates error with correct properties', () => {
      const error = new DropDeckError('Test error', 'TEST_CODE', true, { foo: 'bar' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ foo: 'bar' });
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('DropDeckError');
    });

    it('serializes to JSON correctly', () => {
      const error = new DropDeckError('Test error', 'TEST_CODE');
      const json = error.toJSON();

      expect(json.name).toBe('DropDeckError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_CODE');
      expect(json.isOperational).toBe(true);
      expect(json.timestamp).toBeDefined();
    });
  });

  describe('NetworkError', () => {
    it('creates error with correct defaults', () => {
      const error = new NetworkError();

      expect(error.message).toBe('Network connection error');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('NetworkError');
    });

    it('accepts custom message', () => {
      const error = new NetworkError('Custom network error');
      expect(error.message).toBe('Custom network error');
    });
  });

  describe('ApiError', () => {
    it('creates error with status code', () => {
      const error = new ApiError('Not found', 404, { error: 'Resource not found' });

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('API_ERROR_404');
      expect(error.response).toEqual({ error: 'Resource not found' });
    });
  });

  describe('AuthError', () => {
    it('creates error with correct defaults', () => {
      const error = new AuthError();

      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('AuthError');
    });
  });

  describe('PlatformError', () => {
    it('creates error with platform name', () => {
      const error = new PlatformError('DoorDash', 'Failed to connect');

      expect(error.platform).toBe('DoorDash');
      expect(error.message).toBe('Failed to connect');
      expect(error.context).toEqual({ platform: 'DoorDash' });
    });
  });

  describe('ValidationError', () => {
    it('creates error with validation errors', () => {
      const errors = { email: ['Invalid email'], password: ['Too short'] };
      const error = new ValidationError('Validation failed', errors);

      expect(error.errors).toEqual(errors);
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('creates error with retry time', () => {
      const error = new RateLimitError(30);

      expect(error.retryAfter).toBe(30);
      expect(error.message).toContain('30 seconds');
    });
  });

  describe('OfflineError', () => {
    it('creates error with correct defaults', () => {
      const error = new OfflineError();

      expect(error.message).toBe('You appear to be offline');
      expect(error.code).toBe('OFFLINE_ERROR');
    });
  });
});

describe('Error Utilities', () => {
  describe('getErrorSeverity', () => {
    it('returns low for OfflineError', () => {
      expect(getErrorSeverity(new OfflineError())).toBe('low');
    });

    it('returns medium for NetworkError', () => {
      expect(getErrorSeverity(new NetworkError())).toBe('medium');
    });

    it('returns medium for RateLimitError', () => {
      expect(getErrorSeverity(new RateLimitError(30))).toBe('medium');
    });

    it('returns low for ValidationError', () => {
      expect(getErrorSeverity(new ValidationError('Error', {}))).toBe('low');
    });

    it('returns high for AuthError', () => {
      expect(getErrorSeverity(new AuthError())).toBe('high');
    });

    it('returns high for 5xx ApiError', () => {
      expect(getErrorSeverity(new ApiError('Server error', 500))).toBe('high');
    });

    it('returns high for 401 ApiError', () => {
      expect(getErrorSeverity(new ApiError('Unauthorized', 401))).toBe('high');
    });

    it('returns medium for 4xx ApiError', () => {
      expect(getErrorSeverity(new ApiError('Bad request', 400))).toBe('medium');
    });

    it('returns medium for generic Error', () => {
      expect(getErrorSeverity(new Error('Generic'))).toBe('medium');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('returns friendly message for OfflineError', () => {
      const message = getUserFriendlyMessage(new OfflineError());
      expect(message).toContain('offline');
      expect(message).toContain('internet');
    });

    it('returns friendly message for NetworkError', () => {
      const message = getUserFriendlyMessage(new NetworkError());
      expect(message).toContain('connect');
    });

    it('returns friendly message for RateLimitError', () => {
      const message = getUserFriendlyMessage(new RateLimitError(30));
      expect(message).toContain('30 seconds');
    });

    it('returns friendly message for AuthError', () => {
      const message = getUserFriendlyMessage(new AuthError());
      expect(message).toContain('session');
    });

    it('returns friendly message for PlatformError', () => {
      const message = getUserFriendlyMessage(new PlatformError('DoorDash'));
      expect(message).toContain('DoorDash');
    });

    it('returns message for 404 ApiError', () => {
      const message = getUserFriendlyMessage(new ApiError('Not found', 404));
      expect(message).toContain('not found');
    });

    it('returns message for 5xx ApiError', () => {
      const message = getUserFriendlyMessage(new ApiError('Server error', 500));
      expect(message).toContain('went wrong');
    });

    it('returns generic message for unknown errors', () => {
      const message = getUserFriendlyMessage(new Error('Unknown'));
      expect(message).toContain('try again');
    });
  });

  describe('isRetryableError', () => {
    it('returns true for OfflineError', () => {
      expect(isRetryableError(new OfflineError())).toBe(true);
    });

    it('returns true for NetworkError', () => {
      expect(isRetryableError(new NetworkError())).toBe(true);
    });

    it('returns true for RateLimitError', () => {
      expect(isRetryableError(new RateLimitError(30))).toBe(true);
    });

    it('returns true for 5xx ApiError', () => {
      expect(isRetryableError(new ApiError('Server error', 500))).toBe(true);
      expect(isRetryableError(new ApiError('Server error', 503))).toBe(true);
    });

    it('returns true for 429 ApiError', () => {
      expect(isRetryableError(new ApiError('Rate limited', 429))).toBe(true);
    });

    it('returns false for 4xx ApiError (except 408, 429)', () => {
      expect(isRetryableError(new ApiError('Bad request', 400))).toBe(false);
      expect(isRetryableError(new ApiError('Not found', 404))).toBe(false);
    });

    it('returns false for AuthError', () => {
      expect(isRetryableError(new AuthError())).toBe(false);
    });

    it('returns false for ValidationError', () => {
      expect(isRetryableError(new ValidationError('Error', {}))).toBe(false);
    });

    it('returns false for generic errors', () => {
      expect(isRetryableError(new Error('Generic'))).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('calculates exponential backoff', () => {
      const delay0 = getRetryDelay(0);
      const delay1 = getRetryDelay(1);
      const delay2 = getRetryDelay(2);

      // Each should be roughly double, with jitter
      expect(delay0).toBeGreaterThanOrEqual(1000);
      expect(delay0).toBeLessThanOrEqual(1300); // 1000 + 30% jitter

      expect(delay1).toBeGreaterThanOrEqual(2000);
      expect(delay1).toBeLessThanOrEqual(2600);

      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThanOrEqual(5200);
    });

    it('respects max delay', () => {
      const delay = getRetryDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000 * 1.3); // max + jitter
    });

    it('uses custom base delay', () => {
      const delay = getRetryDelay(0, 500);
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(650);
    });
  });

  describe('normalizeError', () => {
    it('returns DropDeckError as-is', () => {
      const original = new NetworkError('Test');
      const normalized = normalizeError(original);
      expect(normalized).toBe(original);
    });

    it('normalizes fetch errors to NetworkError', () => {
      const normalized = normalizeError(new Error('fetch failed'));
      expect(normalized).toBeInstanceOf(NetworkError);
    });

    it('normalizes offline errors to OfflineError', () => {
      const normalized = normalizeError(new Error('device is offline'));
      expect(normalized).toBeInstanceOf(OfflineError);
    });

    it('normalizes unauthorized errors to AuthError', () => {
      const normalized = normalizeError(new Error('unauthorized'));
      expect(normalized).toBeInstanceOf(AuthError);
    });

    it('normalizes generic errors to DropDeckError', () => {
      const normalized = normalizeError(new Error('Something happened'));
      expect(normalized).toBeInstanceOf(DropDeckError);
      expect(normalized.code).toBe(ErrorCodes.UNKNOWN_ERROR);
    });

    it('normalizes string errors', () => {
      const normalized = normalizeError('String error');
      expect(normalized).toBeInstanceOf(DropDeckError);
      expect(normalized.message).toBe('String error');
    });

    it('normalizes unknown types', () => {
      const normalized = normalizeError(null);
      expect(normalized).toBeInstanceOf(DropDeckError);
      expect(normalized.message).toBe('An unknown error occurred');
    });
  });

  describe('logError', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('logs error with context in development', () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error - Testing NODE_ENV assignment
      process.env.NODE_ENV = 'development';

      const error = new NetworkError('Test');
      logError(error, { extra: 'context' });

      expect(consoleSpy).toHaveBeenCalled();
      const logArg = consoleSpy.mock.calls[0];
      expect(logArg[0]).toContain('MEDIUM');
      expect(logArg[0]).toContain('NetworkError');

      // @ts-expect-error - Restoring NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('logs simplified error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-expect-error - Testing NODE_ENV assignment
      process.env.NODE_ENV = 'production';

      const error = new NetworkError('Test');
      logError(error);

      expect(consoleSpy).toHaveBeenCalled();
      const logArg = consoleSpy.mock.calls[0][0];
      expect(logArg).toContain('NetworkError');
      expect(logArg).toContain('Test');

      // @ts-expect-error - Restoring NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('ErrorCodes', () => {
  it('has correct error codes defined', () => {
    expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCodes.OFFLINE_ERROR).toBe('OFFLINE_ERROR');
    expect(ErrorCodes.AUTH_ERROR).toBe('AUTH_ERROR');
    expect(ErrorCodes.RATE_LIMIT).toBe('RATE_LIMIT_ERROR');
    expect(ErrorCodes.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
  });
});
