import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * OAuth token set returned from token exchange
 */
export interface TokenSet {
  /** Access token for API calls */
  accessToken: string;
  /** Refresh token for renewing access (may not be present for all platforms) */
  refreshToken?: string;
  /** Token expiration time */
  expiresAt?: Date;
  /** Token type (usually "Bearer") */
  tokenType?: string;
  /** Granted scopes */
  scope?: string;
  /** ID token for OIDC (if applicable) */
  idToken?: string;
}

/**
 * Adapter connection context
 * Passed to adapter methods for authenticated requests
 */
export interface AdapterConnection {
  /** Decrypted access token */
  accessToken: string;
  /** User ID in DropDeck */
  userId: string;
  /** Platform identifier */
  platform: Platform;
  /** Refresh token if available */
  refreshToken?: string;
  /** Connection metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Webhook payload wrapper
 */
export interface WebhookPayload<T = unknown> {
  /** Platform that sent the webhook */
  platform: Platform;
  /** Event type */
  eventType: string;
  /** Event ID for idempotency */
  eventId: string;
  /** Timestamp of the event */
  timestamp: Date;
  /** Raw payload from platform */
  data: T;
  /** Webhook signature (if provided) */
  signature?: string;
}

/**
 * Status mapping from platform-specific to unified
 */
export interface StatusMapping {
  /** Platform-specific status string */
  platformStatus: string;
  /** Unified DropDeck status */
  unifiedStatus: DeliveryStatus;
  /** Human-readable label */
  label: string;
}

/**
 * Adapter capabilities
 */
export interface AdapterCapabilities {
  /** Supports OAuth authentication */
  oauth: boolean;
  /** Supports incoming webhooks */
  webhooks: boolean;
  /** Supports real-time location tracking */
  liveLocation: boolean;
  /** Supports driver contact */
  driverContact: boolean;
  /** Requires session-based auth */
  sessionAuth: boolean;
  /** Supports order items in response */
  orderItems: boolean;
  /** Supports ETA updates */
  etaUpdates: boolean;
}

/**
 * Adapter metadata
 */
export interface AdapterMetadata {
  /** Unique platform identifier */
  platformId: Platform;
  /** Display name */
  displayName: string;
  /** Platform icon URL */
  iconUrl?: string;
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Platform capabilities */
  capabilities: AdapterCapabilities;
  /** Minimum polling interval in seconds */
  minPollingInterval: number;
  /** Maximum polling interval in seconds */
  maxPollingInterval: number;
  /** Default polling interval in seconds */
  defaultPollingInterval: number;
  /** API base URL */
  apiBaseUrl?: string;
  /** OAuth authorization URL */
  authorizationUrl?: string;
  /** OAuth token URL */
  tokenUrl?: string;
}

/**
 * Fetch options for adapter requests
 */
export interface AdapterFetchOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Headers to include */
  headers?: Record<string, string>;
  /** Skip rate limit handling */
  skipRateLimit?: boolean;
}

/**
 * Adapter error codes
 */
export enum AdapterErrorCode {
  /** Authentication failed or expired */
  AUTH_ERROR = 'AUTH_ERROR',
  /** Rate limited by platform */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Platform is unavailable */
  PLATFORM_UNAVAILABLE = 'PLATFORM_UNAVAILABLE',
  /** Invalid data from platform */
  DATA_ERROR = 'DATA_ERROR',
  /** Network error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Webhook verification failed */
  WEBHOOK_INVALID = 'WEBHOOK_INVALID',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Polling status
 */
export interface PollingStatus {
  /** Last successful poll time */
  lastPoll?: Date;
  /** Next scheduled poll time */
  nextPoll?: Date;
  /** Number of consecutive failures */
  failureCount: number;
  /** Last error message */
  lastError?: string;
  /** Whether polling is active */
  isActive: boolean;
}

/**
 * Batch delivery result
 */
export interface BatchDeliveryResult {
  /** Successfully fetched deliveries */
  deliveries: UnifiedDelivery[];
  /** Errors encountered */
  errors: Array<{
    platform: Platform;
    error: string;
    code: AdapterErrorCode;
  }>;
  /** Total fetch time in milliseconds */
  fetchTimeMs: number;
}
