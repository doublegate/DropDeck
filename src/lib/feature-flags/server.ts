/**
 * Server-side feature flag utilities
 */

import { featureFlags, getFeatureFlagValue } from './config';

/**
 * Get current environment
 */
function getCurrentEnvironment(): 'development' | 'staging' | 'production' {
  const env = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === 'preview') return 'staging';
  if (env === 'production') return 'production';
  if (env === 'test') return 'staging';
  return 'development';
}

/**
 * Check if a feature flag is enabled (server-side)
 */
export function isFeatureEnabled(flagKey: string, userId?: string): boolean {
  const flag = featureFlags[flagKey];
  if (!flag) {
    console.warn(`Unknown feature flag: ${flagKey}`);
    return false;
  }

  const environment = getCurrentEnvironment();

  // For boolean flags, use environment value
  if (flag.type === 'boolean') {
    return getFeatureFlagValue(flag, environment);
  }

  // For percentage rollouts
  if (flag.type === 'percentage') {
    if (!userId) {
      return getFeatureFlagValue(flag, environment);
    }

    // Deterministic percentage based on user ID
    const hash = hashUserId(userId);
    const percentage = flag.percentage ?? 0;
    return hash < percentage;
  }

  // For user list
  if (flag.type === 'userList') {
    if (!userId) return false;
    return flag.userIds?.includes(userId) ?? false;
  }

  return flag.defaultValue;
}

/**
 * Check multiple feature flags at once
 */
export function getEnabledFeatures(flagKeys: string[], userId?: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const key of flagKeys) {
    result[key] = isFeatureEnabled(key, userId);
  }

  return result;
}

/**
 * Get all feature flags for the current environment
 */
export function getAllFlags(userId?: string): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const key of Object.keys(featureFlags)) {
    result[key] = isFeatureEnabled(key, userId);
  }

  return result;
}

/**
 * Hash user ID to a number between 0-100 for percentage rollouts
 * Uses a simple but consistent hash function
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Feature flag guard for server components/actions
 */
export async function requireFeature(flagKey: string, userId?: string): Promise<void> {
  if (!isFeatureEnabled(flagKey, userId)) {
    throw new Error(`Feature "${flagKey}" is not enabled`);
  }
}

/**
 * Feature flag wrapper for server actions
 */
export function withFeatureFlag<T extends (...args: unknown[]) => Promise<unknown>>(
  flagKey: string,
  action: T,
  fallback?: T
): T {
  return (async (...args: Parameters<T>) => {
    if (!isFeatureEnabled(flagKey)) {
      if (fallback) {
        return fallback(...args);
      }
      throw new Error(`Feature "${flagKey}" is not enabled`);
    }
    return action(...args);
  }) as T;
}
