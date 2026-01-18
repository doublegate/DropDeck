import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';
import type { Platform } from '@/types/platform';
import {
  PlatformAuthError,
  PlatformNetworkError,
  PlatformRateLimitError,
  PlatformUnavailableError,
} from './errors';
import type {
  AdapterCapabilities,
  AdapterConnection,
  AdapterFetchOptions,
  AdapterMetadata,
  TokenSet,
  WebhookPayload,
} from './types';

/**
 * Default fetch options
 */
const DEFAULT_FETCH_OPTIONS: Required<AdapterFetchOptions> = {
  timeout: 10000, // 10 seconds
  retries: 3,
  headers: {},
  skipRateLimit: false,
};

/**
 * Abstract base class for platform adapters
 * All platform-specific adapters must extend this class
 */
export abstract class PlatformAdapter {
  /**
   * Platform metadata
   */
  abstract readonly metadata: AdapterMetadata;

  /**
   * Get the platform ID
   */
  get platformId(): Platform {
    return this.metadata.platformId;
  }

  /**
   * Get the display name
   */
  get displayName(): string {
    return this.metadata.displayName;
  }

  /**
   * Get the icon URL
   */
  get iconUrl(): string | undefined {
    return this.metadata.iconUrl;
  }

  /**
   * Get the primary color
   */
  get primaryColor(): string {
    return this.metadata.primaryColor;
  }

  /**
   * Get platform capabilities
   */
  get capabilities(): AdapterCapabilities {
    return this.metadata.capabilities;
  }

  // ============================================
  // OAuth Methods
  // ============================================

  /**
   * Check if this adapter supports OAuth
   */
  supportsOAuth(): boolean {
    return this.capabilities.oauth;
  }

  /**
   * Get the OAuth authorization URL
   * @param userId - The user's ID in DropDeck
   * @param state - CSRF state token
   * @returns OAuth authorization URL
   */
  async getOAuthUrl(_userId: string, _state: string): Promise<string> {
    throw new Error(`${this.platformId} does not support OAuth`);
  }

  /**
   * Exchange OAuth code for tokens
   * @param code - The authorization code from OAuth callback
   * @returns Token set with access and refresh tokens
   */
  async exchangeCode(_code: string): Promise<TokenSet> {
    throw new Error(`${this.platformId} does not support OAuth`);
  }

  /**
   * Refresh an expired access token
   * @param refreshToken - The refresh token
   * @returns New token set
   */
  async refreshToken(_refreshToken: string): Promise<TokenSet> {
    throw new Error(`${this.platformId} does not support token refresh`);
  }

  /**
   * Revoke a token (logout/disconnect)
   * @param accessToken - The access token to revoke
   */
  async revokeToken(_accessToken: string): Promise<void> {
    // Default: do nothing (not all platforms support token revocation)
  }

  /**
   * Test if a connection is valid
   * @param accessToken - The access token to test
   */
  async testConnection(_accessToken: string): Promise<void> {
    throw new Error(`${this.platformId} does not implement connection test`);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  /**
   * Get all active deliveries for a user
   * @param connection - The adapter connection context
   * @returns Array of unified deliveries
   */
  abstract getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]>;

  /**
   * Get detailed information about a specific delivery
   * @param connection - The adapter connection context
   * @param deliveryId - The delivery ID (external)
   * @returns Unified delivery with full details
   */
  abstract getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery>;

  // ============================================
  // Webhook Methods
  // ============================================

  /**
   * Check if this adapter supports webhooks
   */
  supportsWebhooks(): boolean {
    return this.capabilities.webhooks;
  }

  /**
   * Verify a webhook signature
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature from headers
   * @returns True if signature is valid
   */
  verifyWebhook(_payload: unknown, _signature: string | null): boolean {
    return false;
  }

  /**
   * Normalize a webhook payload to unified delivery format
   * @param payload - Raw webhook payload
   * @returns Unified delivery object
   */
  normalizeWebhookPayload(_payload: WebhookPayload): UnifiedDelivery | null {
    return null;
  }

  // ============================================
  // Polling Methods
  // ============================================

  /**
   * Get the recommended polling interval in seconds
   * @param hasActiveDelivery - Whether user has an active delivery
   */
  getPollingInterval(hasActiveDelivery = false): number {
    if (hasActiveDelivery) {
      return this.metadata.minPollingInterval;
    }
    return this.metadata.defaultPollingInterval;
  }

  // ============================================
  // Status Mapping
  // ============================================

  /**
   * Map a platform-specific status to unified status
   * @param platformStatus - The platform's status string
   * @returns Unified delivery status
   */
  abstract mapStatus(platformStatus: string): DeliveryStatus;

  /**
   * Get a human-readable label for a status
   * @param status - The unified delivery status
   * @returns Human-readable status label
   */
  getStatusLabel(status: DeliveryStatus): string {
    const labels: Record<DeliveryStatus, string> = {
      preparing: 'Preparing',
      ready_for_pickup: 'Ready for Pickup',
      driver_assigned: 'Driver Assigned',
      driver_heading_to_store: 'Driver Heading to Store',
      driver_at_store: 'Driver at Store',
      out_for_delivery: 'Out for Delivery',
      arriving: 'Arriving',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      delayed: 'Delayed',
    };
    return labels[status] ?? status;
  }

  // ============================================
  // HTTP Request Helpers
  // ============================================

  /**
   * Make an authenticated request to the platform API
   */
  protected async fetchWithAuth<T>(
    url: string,
    accessToken: string,
    options: AdapterFetchOptions & { method?: string; body?: unknown } = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_FETCH_OPTIONS, ...options };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

    try {
      const response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...opts.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle common error responses
      if (response.status === 401 || response.status === 403) {
        throw new PlatformAuthError(this.platformId);
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
        throw new PlatformRateLimitError(this.platformId, retryAfter);
      }

      if (response.status >= 500) {
        throw new PlatformUnavailableError(this.platformId);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new PlatformNetworkError(this.platformId, 'Request timeout');
      }

      throw error;
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Generate a unique delivery ID for DropDeck
   */
  protected generateDeliveryId(externalId: string): string {
    const prefix = this.platformId.slice(0, 2);
    return `${prefix}_${externalId}`;
  }

  /**
   * Calculate ETA in minutes from a timestamp
   */
  protected calculateEtaMinutes(estimatedArrival: Date): number {
    const now = new Date();
    const diffMs = estimatedArrival.getTime() - now.getTime();
    return Math.max(0, Math.round(diffMs / 60000));
  }
}

/**
 * Abstract class for session-based adapters
 * Used for platforms that require session cookie authentication
 */
export abstract class SessionBasedAdapter extends PlatformAdapter {
  /**
   * Login with credentials and get session
   */
  abstract login(email: string, password: string): Promise<TokenSet>;

  /**
   * Refresh the session
   */
  abstract refreshSession(sessionData: string): Promise<TokenSet>;

  /**
   * Session-based adapters don't support OAuth
   */
  supportsOAuth(): boolean {
    return false;
  }
}
