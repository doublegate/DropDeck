import { createPlatformRateLimiter, checkRateLimit } from '@/lib/ratelimit';
import {
  PlatformAuthError,
  PlatformRateLimitError,
  PlatformUnavailableError,
  PlatformNetworkError,
  PlatformDataError,
} from '../errors';
import { withRetry } from '../utils';
import {
  WalmartOrdersResponseSchema,
  WalmartOrderSchema,
  type WalmartOrdersResponse,
  type WalmartOrder,
  type WalmartSessionData,
} from './types';

/**
 * Walmart API Client
 * Handles session-based authentication for Walmart+ orders
 */
export class WalmartApiClient {
  private readonly baseUrl = 'https://www.walmart.com/api';
  private readonly rateLimiter = createPlatformRateLimiter('walmart');
  private readonly platform = 'walmart' as const;

  // Required session cookies
  private readonly requiredCookies = ['auth', 'vtc', 'ACID', 'customer'];

  /**
   * Validate session data
   */
  validateSession(sessionData: WalmartSessionData): boolean {
    if (!sessionData.cookies) return false;

    // Check for required cookies
    for (const cookie of this.requiredCookies) {
      if (!sessionData.cookies[cookie]) {
        return false;
      }
    }

    // Check if session is too old (older than 7 days)
    const lastRefreshed = new Date(sessionData.lastRefreshed);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - lastRefreshed.getTime() > maxAge) {
      return false;
    }

    return true;
  }

  /**
   * Build cookie string from session data
   */
  private buildCookieString(sessionData: WalmartSessionData): string {
    return Object.entries(sessionData.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  /**
   * Get active orders
   */
  async getActiveOrders(sessionData: WalmartSessionData): Promise<WalmartOrdersResponse> {
    const data = await this.makeRequest<{ data: unknown }>(
      '/order/v1/orders?status=active',
      sessionData
    );
    return WalmartOrdersResponseSchema.parse(data.data);
  }

  /**
   * Get order by ID
   */
  async getOrder(sessionData: WalmartSessionData, orderId: string): Promise<WalmartOrder> {
    const data = await this.makeRequest<{ data: unknown }>(
      `/order/v1/orders/${orderId}`,
      sessionData
    );
    return WalmartOrderSchema.parse(data.data);
  }

  /**
   * Get order history
   */
  async getOrderHistory(
    sessionData: WalmartSessionData,
    options: { cursor?: string } = {}
  ): Promise<WalmartOrdersResponse> {
    const params = new URLSearchParams();
    if (options.cursor) params.set('cursor', options.cursor);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.makeRequest<{ data: unknown }>(`/order/v1/orders${query}`, sessionData);
    return WalmartOrdersResponseSchema.parse(data.data);
  }

  /**
   * Get delivery tracking
   */
  async getDeliveryTracking(
    sessionData: WalmartSessionData,
    orderId: string
  ): Promise<{
    driver?: {
      location?: { latitude: number; longitude: number };
      eta_minutes?: number;
    };
  } | null> {
    try {
      const data = await this.makeRequest<{
        data?: {
          tracking?: {
            driver?: {
              location?: { lat: number; lng: number };
            };
            eta?: number;
          };
        };
      }>(`/order/v1/orders/${orderId}/tracking`, sessionData);

      if (data.data?.tracking) {
        return {
          driver: {
            location: data.data.tracking.driver?.location
              ? {
                  latitude: data.data.tracking.driver.location.lat,
                  longitude: data.data.tracking.driver.location.lng,
                }
              : undefined,
            eta_minutes: data.data.tracking.eta,
          },
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get available delivery slots
   */
  async getDeliverySlots(
    sessionData: WalmartSessionData,
    storeId: string
  ): Promise<Array<{ slotId: string; startTime: string; endTime: string; type: string }>> {
    try {
      const data = await this.makeRequest<{
        data?: {
          slots?: Array<{
            id: string;
            start: string;
            end: string;
            type: string;
          }>;
        };
      }>(`/delivery/v1/slots?storeId=${storeId}`, sessionData);

      return (
        data.data?.slots?.map((slot) => ({
          slotId: slot.id,
          startTime: slot.start,
          endTime: slot.end,
          type: slot.type,
        })) ?? []
      );
    } catch {
      return [];
    }
  }

  /**
   * Make authenticated request to Walmart API
   */
  private async makeRequest<T>(
    endpoint: string,
    sessionData: WalmartSessionData,
    options: {
      method?: string;
      body?: unknown;
      timeout?: number;
    } = {}
  ): Promise<T> {
    // Validate session
    if (!this.validateSession(sessionData)) {
      throw new PlatformAuthError(this.platform, 'Session expired or invalid');
    }

    // Check rate limit
    if (this.rateLimiter) {
      const rateLimitResult = await checkRateLimit(this.rateLimiter, 'walmart-api');
      if (!rateLimitResult.success) {
        throw new PlatformRateLimitError(
          this.platform,
          Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        );
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: {
            Cookie: this.buildCookieString(sessionData),
            'User-Agent': sessionData.userAgent,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-o-correlation-id': crypto.randomUUID(),
            'x-o-platform': 'web',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle error responses
        if (response.status === 401 || response.status === 403) {
          throw new PlatformAuthError(this.platform, 'Session expired');
        }

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '120', 10);
          throw new PlatformRateLimitError(this.platform, retryAfter);
        }

        if (response.status >= 500) {
          throw new PlatformUnavailableError(this.platform);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new PlatformDataError(
            this.platform,
            `API error: ${errorData.message || response.statusText}`,
            errorData
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          throw new PlatformNetworkError(this.platform, 'Request timeout');
        }

        throw error;
      }
    };

    // Retry on transient errors
    return withRetry(fetchFn, 3, 2000);
  }
}

/**
 * Singleton instance
 */
let clientInstance: WalmartApiClient | null = null;

/**
 * Get Walmart API client instance
 */
export function getWalmartClient(): WalmartApiClient {
  if (!clientInstance) {
    clientInstance = new WalmartApiClient();
  }
  return clientInstance;
}
