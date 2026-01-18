/**
 * Platform Adapters - Main Export
 */

// Base classes
export { PlatformAdapter, SessionBasedAdapter } from './base';
// Errors
export {
  getRetryDelay,
  isPlatformAdapterError,
  isRetryableError,
  PlatformAdapterError,
  PlatformAuthError,
  PlatformDataError,
  PlatformNetworkError,
  PlatformRateLimitError,
  PlatformUnavailableError,
  WebhookValidationError,
} from './errors';
// Registry
export {
  adapterRegistry,
  getAdapter,
  getAdapterAsync,
  getAllAdapters,
  hasAdapter,
  registerAdapter,
} from './registry';
// Status mapping
export { getStatusMap, mapPlatformStatus } from './status-map';
// Types
export type {
  AdapterCapabilities,
  AdapterConnection,
  AdapterErrorCode,
  AdapterFetchOptions,
  AdapterMetadata,
  BatchDeliveryResult,
  PollingStatus,
  StatusMapping,
  TokenSet,
  WebhookPayload,
} from './types';

// Utilities
export {
  calculateDistance,
  calculateEtaFromDistance,
  calculateHeading,
  formatCurrency,
  formatEta,
  generateId,
  interpolateLocation,
  maskLicensePlate,
  maskPhoneNumber,
  parseDate,
  sleep,
  withRetry,
} from './utils';
