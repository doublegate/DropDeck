/**
 * Monitoring utilities barrel export
 */

// Logger
export {
  type LogContext,
  type LogLevel,
  logExternalCall,
  logger,
  logQuery,
  logRequest,
} from './logger';

// Metrics
export {
  getMetrics,
  getMetricValue,
  incrementCounter,
  type MetricData,
  type MetricType,
  metrics,
  recordHistogram,
  setGauge,
} from './metrics';

// Performance
export {
  createTrackedDb,
  endMeasure,
  measure,
  measureSync,
  type PerformanceMark,
  rateWebVital,
  reportWebVital,
  startMeasure,
  trackApiPerformance,
  trackQueryPerformance,
  WEB_VITALS_THRESHOLDS,
} from './performance';
