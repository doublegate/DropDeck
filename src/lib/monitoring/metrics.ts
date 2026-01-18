/**
 * Metrics collection for DropDeck
 * Collects and reports application metrics
 */

import { redis } from '@/lib/realtime/redis';

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

/**
 * Metric keys in Redis
 */
const METRICS_PREFIX = 'metrics:';
const METRICS_TTL = 86400; // 24 hours

/**
 * Generate a metric key
 */
function getMetricKey(name: string, labels?: Record<string, string>): string {
  const labelStr = labels
    ? Object.entries(labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join(',')
    : '';

  return `${METRICS_PREFIX}${name}${labelStr ? `:${labelStr}` : ''}`;
}

/**
 * Increment a counter metric
 */
export async function incrementCounter(
  name: string,
  value = 1,
  labels?: Record<string, string>
): Promise<void> {
  if (!redis) return;

  const key = getMetricKey(name, labels);
  try {
    await redis.incrby(key, value);
    await redis.expire(key, METRICS_TTL);
  } catch (error) {
    // Silently fail - metrics should not break the app
    console.warn('Failed to increment counter:', error);
  }
}

/**
 * Set a gauge metric
 */
export async function setGauge(
  name: string,
  value: number,
  labels?: Record<string, string>
): Promise<void> {
  if (!redis) return;

  const key = getMetricKey(name, labels);
  try {
    await redis.set(key, value, { ex: METRICS_TTL });
  } catch (error) {
    console.warn('Failed to set gauge:', error);
  }
}

/**
 * Record a histogram value
 */
export async function recordHistogram(
  name: string,
  value: number,
  labels?: Record<string, string>
): Promise<void> {
  if (!redis) return;

  const key = `${getMetricKey(name, labels)}:values`;
  try {
    // Store values in a sorted set for percentile calculation
    await redis.zadd(key, { score: Date.now(), member: `${Date.now()}:${value}` });
    await redis.expire(key, METRICS_TTL);

    // Keep only last 1000 values
    await redis.zremrangebyrank(key, 0, -1001);
  } catch (error) {
    console.warn('Failed to record histogram:', error);
  }
}

/**
 * Pre-defined metrics
 */
export const metrics = {
  // Request metrics
  async httpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
  ): Promise<void> {
    await Promise.all([
      incrementCounter('http_requests_total', 1, { method, path, status: String(statusCode) }),
      recordHistogram('http_request_duration_ms', durationMs, { method, path }),
    ]);
  },

  // Database metrics
  async dbQuery(operation: string, table: string, durationMs: number): Promise<void> {
    await Promise.all([
      incrementCounter('db_queries_total', 1, { operation, table }),
      recordHistogram('db_query_duration_ms', durationMs, { operation, table }),
    ]);
  },

  // Authentication metrics
  async authEvent(
    event: 'login' | 'logout' | 'signup' | 'error',
    provider?: string
  ): Promise<void> {
    await incrementCounter('auth_events_total', 1, { event, provider: provider ?? 'unknown' });
  },

  // Platform metrics
  async platformSync(platform: string, success: boolean, deliveryCount: number): Promise<void> {
    await Promise.all([
      incrementCounter('platform_syncs_total', 1, { platform, success: String(success) }),
      setGauge('platform_deliveries', deliveryCount, { platform }),
    ]);
  },

  // WebSocket metrics
  async wsConnection(event: 'connect' | 'disconnect' | 'error'): Promise<void> {
    await incrementCounter('ws_connections_total', 1, { event });
  },

  // Delivery metrics
  async deliveryStatusChange(
    platform: string,
    fromStatus: string,
    toStatus: string
  ): Promise<void> {
    await incrementCounter('delivery_status_changes_total', 1, {
      platform,
      from_status: fromStatus,
      to_status: toStatus,
    });
  },

  // Active user gauge
  async setActiveUsers(count: number): Promise<void> {
    await setGauge('active_users', count);
  },

  // Active deliveries gauge
  async setActiveDeliveries(count: number, platform?: string): Promise<void> {
    await setGauge('active_deliveries', count, platform ? { platform } : undefined);
  },
};

/**
 * Get metric value
 */
export async function getMetricValue(
  name: string,
  labels?: Record<string, string>
): Promise<number | null> {
  if (!redis) return null;

  const key = getMetricKey(name, labels);
  try {
    const value = await redis.get(key);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

/**
 * Get all metrics matching a pattern
 */
export async function getMetrics(pattern: string): Promise<MetricData[]> {
  if (!redis) return [];

  try {
    const keys = await redis.keys(`${METRICS_PREFIX}${pattern}`);
    const results: MetricData[] = [];

    for (const key of keys) {
      const value = await redis.get(key);
      if (value !== null) {
        // Parse key to extract name and labels
        const keyPart = key.replace(METRICS_PREFIX, '');
        const [name, labelsStr] = keyPart.split(':');

        const labels: Record<string, string> = {};
        if (labelsStr) {
          for (const pair of labelsStr.split(',')) {
            const [k, v] = pair.split('=');
            if (k && v) labels[k] = v;
          }
        }

        results.push({
          name: name ?? keyPart,
          type: 'gauge', // Default type
          value: Number(value),
          labels: Object.keys(labels).length > 0 ? labels : undefined,
          timestamp: Date.now(),
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}
