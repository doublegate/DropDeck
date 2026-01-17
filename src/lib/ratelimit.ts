import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './realtime/redis';

/**
 * Rate limiters for different API endpoints
 * Uses Upstash Ratelimit with sliding window algorithm
 */

/**
 * Default API rate limiter
 * 100 requests per minute per IP
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'ratelimit:api',
      analytics: true,
    })
  : null;

/**
 * Platform-specific rate limiter factory
 * 30 requests per minute per user per platform
 */
export function createPlatformRateLimiter(platform: string) {
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: `ratelimit:platform:${platform}`,
    analytics: true,
  });
}

/**
 * Webhook rate limiter
 * 1000 requests per minute (for incoming webhooks)
 */
export const webhookRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      prefix: 'ratelimit:webhook',
      analytics: true,
    })
  : null;

/**
 * Auth rate limiter
 * 10 attempts per minute per IP (for login/signup)
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:auth',
      analytics: true,
    })
  : null;

/**
 * Check rate limit and return result
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  if (!limiter) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Rate limit headers for responses
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)).toString(),
  };
}
