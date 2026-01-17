import { Redis } from '@upstash/redis';

/**
 * Redis client for DropDeck
 * Uses Upstash Redis for serverless compatibility
 */

/**
 * Get Redis configuration from environment
 */
function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

/**
 * Create Redis client
 * Returns null if not configured (graceful degradation)
 */
function createRedisClient(): Redis | null {
  const config = getRedisConfig();

  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Redis not configured - some features will be disabled');
    }
    return null;
  }

  return new Redis({
    url: config.url,
    token: config.token,
  });
}

/**
 * Singleton Redis client instance
 */
export const redis = createRedisClient();

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Redis channel names for pub/sub
 */
export const channels = {
  /** User's delivery updates channel */
  userDeliveries: (userId: string) => `user:${userId}:deliveries`,

  /** User's platform connection status */
  userConnections: (userId: string) => `user:${userId}:connections`,

  /** Delivery location updates (high frequency) */
  deliveryLocation: (deliveryId: string) => `delivery:${deliveryId}:location`,

  /** System-wide status announcements */
  systemStatus: 'system:status',

  /** Platform-specific updates */
  platformStatus: (platform: string) => `platform:${platform}:status`,
} as const;

/**
 * Cache key builders
 */
export const cacheKeys = {
  /** OAuth state for CSRF protection */
  oauthState: (state: string) => `oauth_state:${state}`,

  /** User's cached deliveries */
  userDeliveries: (userId: string, platform?: string) =>
    platform ? `cache:user:${userId}:deliveries:${platform}` : `cache:user:${userId}:deliveries`,

  /** Webhook idempotency check */
  webhookIdempotency: (platform: string, eventId: string) => `webhook:${platform}:${eventId}`,

  /** Rate limit counter */
  rateLimit: (type: string, identifier: string) => `ratelimit:${type}:${identifier}`,

  /** Session data */
  session: (sessionId: string) => `session:${sessionId}`,
} as const;

/**
 * Default TTL values in seconds
 */
export const ttl = {
  oauthState: 600, // 10 minutes
  deliveryCache: 30, // 30 seconds
  webhookIdempotency: 3600, // 1 hour
  session: 86400, // 24 hours
} as const;
