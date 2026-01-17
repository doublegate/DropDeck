/**
 * Platform Adapters - Main Export
 */

// Base classes
export { PlatformAdapter, SessionBasedAdapter } from './base';

// Types
export type {
  TokenSet,
  AdapterConnection,
  WebhookPayload,
  AdapterMetadata,
  AdapterCapabilities,
  AdapterFetchOptions,
  StatusMapping,
  PollingStatus,
  BatchDeliveryResult,
  AdapterErrorCode,
} from './types';

// Errors
export {
  PlatformAdapterError,
  PlatformAuthError,
  PlatformRateLimitError,
  PlatformUnavailableError,
  PlatformDataError,
  PlatformNetworkError,
  WebhookValidationError,
  isPlatformAdapterError,
  isRetryableError,
  getRetryDelay,
} from './errors';

// Registry
export {
  adapterRegistry,
  registerAdapter,
  getAdapter,
  getAdapterAsync,
  getAllAdapters,
  hasAdapter,
} from './registry';

// Status mapping
export { mapPlatformStatus, getStatusMap } from './status-map';

// Utilities
export {
  calculateDistance,
  calculateEtaFromDistance,
  calculateHeading,
  interpolateLocation,
  withRetry,
  sleep,
  maskPhoneNumber,
  maskLicensePlate,
  formatCurrency,
  formatEta,
  parseDate,
  generateId,
} from './utils';
