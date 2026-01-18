/**
 * Performance tracking utilities for DropDeck
 * Measures and reports performance metrics
 */

import { logger } from './logger';
import { metrics, recordHistogram } from './metrics';

/**
 * Performance mark for timing operations
 */
export interface PerformanceMark {
  name: string;
  startTime: number;
  metadata?: Record<string, string>;
}

/**
 * Start a performance measurement
 */
export function startMeasure(name: string, metadata?: Record<string, string>): PerformanceMark {
  return {
    name,
    startTime: performance.now(),
    metadata,
  };
}

/**
 * End a performance measurement and record the duration
 */
export async function endMeasure(mark: PerformanceMark): Promise<number> {
  const duration = performance.now() - mark.startTime;

  // Log if duration is notable
  if (duration > 100) {
    logger.debug(`Performance: ${mark.name} took ${duration.toFixed(2)}ms`, mark.metadata);
  }

  // Record to metrics
  await recordHistogram(`perf_${mark.name}_ms`, duration, mark.metadata);

  return duration;
}

/**
 * Measure an async function execution time
 */
export async function measure<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, string>
): Promise<T> {
  const mark = startMeasure(name, metadata);
  try {
    return await fn();
  } finally {
    await endMeasure(mark);
  }
}

/**
 * Measure a sync function execution time
 */
export function measureSync<T>(name: string, fn: () => T, metadata?: Record<string, string>): T {
  const mark = startMeasure(name, metadata);
  try {
    return fn();
  } finally {
    // Fire and forget for sync operations
    endMeasure(mark).catch(() => {});
  }
}

/**
 * Track API route performance
 */
export async function trackApiPerformance(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): Promise<void> {
  await metrics.httpRequest(method, path, statusCode, durationMs);

  // Log slow requests
  if (durationMs > 1000) {
    logger.warn(`Slow API response: ${method} ${path} took ${durationMs}ms`, {
      method,
      path,
      statusCode,
      durationMs,
    });
  }
}

/**
 * Track database query performance
 */
export async function trackQueryPerformance(
  operation: string,
  table: string,
  durationMs: number
): Promise<void> {
  await metrics.dbQuery(operation, table, durationMs);

  // Log slow queries
  if (durationMs > 100) {
    logger.warn(`Slow DB query: ${operation} on ${table} took ${durationMs}ms`, {
      operation,
      table,
      durationMs,
    });
  }
}

/**
 * Create a performance-tracked wrapper for database operations
 */
export function createTrackedDb<T extends object>(db: T, tableName: string): T {
  return new Proxy(db, {
    get(target, prop) {
      const value = target[prop as keyof T];

      if (typeof value === 'function') {
        return async (...args: unknown[]) => {
          const mark = startMeasure('db_query', { table: tableName, operation: String(prop) });
          try {
            return await (value as (...args: unknown[]) => Promise<unknown>).apply(target, args);
          } finally {
            const duration = await endMeasure(mark);
            await trackQueryPerformance(String(prop), tableName, duration);
          }
        };
      }

      return value;
    },
  });
}

/**
 * Web Vitals thresholds
 */
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
} as const;

/**
 * Rate a Web Vital metric
 */
export function rateWebVital(
  metric: keyof typeof WEB_VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metric];

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Report a Web Vital metric
 */
export async function reportWebVital(name: string, value: number, id: string): Promise<void> {
  const metricName = name as keyof typeof WEB_VITALS_THRESHOLDS;
  const rating = WEB_VITALS_THRESHOLDS[metricName] ? rateWebVital(metricName, value) : 'unknown';

  await recordHistogram(`web_vital_${name.toLowerCase()}`, value, { rating });

  logger.debug(`Web Vital: ${name} = ${value}`, { metric: name, value, rating, id });
}
