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
  InstacartTokenResponseSchema,
  InstacartOrdersResponseSchema,
  InstacartOrderSchema,
  type InstacartTokenResponse,
  type InstacartOrdersResponse,
  type InstacartOrder,
} from './types';

/**
 * Instacart API Client
 * Handles all HTTP communication with Instacart Connect API
 */
export class InstacartApiClient {
  private readonly baseUrl = 'https://connect.instacart.com/v2';
  private readonly authUrl = 'https://connect.instacart.com/oauth';
  private readonly rateLimiter = createPlatformRateLimiter('instacart');
  private readonly platform = 'instacart' as const;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    const clientId = process.env.INSTACART_CLIENT_ID;
    const clientSecret = process.env.INSTACART_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('INSTACART_CLIENT_ID and INSTACART_CLIENT_SECRET are required');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/instacart`;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const scopes = ['orders:read', 'profile:read'];
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
    });

    return `${this.authUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<InstacartTokenResponse> {
    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PlatformAuthError(
        this.platform,
        `Token exchange failed: ${error.error_description || response.statusText}`
      );
    }

    const data = await response.json();
    return InstacartTokenResponseSchema.parse(data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<InstacartTokenResponse> {
    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new PlatformAuthError(
        this.platform,
        `Token refresh failed: ${error.error_description || response.statusText}`
      );
    }

    const data = await response.json();
    return InstacartTokenResponseSchema.parse(data);
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    await fetch(`${this.authUrl}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        token: accessToken,
      }),
    });
    // Ignore response - revocation is best-effort
  }

  /**
   * Test connection with access token
   */
  async testConnection(accessToken: string): Promise<void> {
    await this.makeRequest('/me', accessToken);
  }

  /**
   * Get active orders
   */
  async getActiveOrders(accessToken: string): Promise<InstacartOrdersResponse> {
    const data = await this.makeRequest<unknown>('/orders?status=active', accessToken);
    return InstacartOrdersResponseSchema.parse(data);
  }

  /**
   * Get order by ID
   */
  async getOrder(accessToken: string, orderId: string): Promise<InstacartOrder> {
    const data = await this.makeRequest<unknown>(`/orders/${orderId}`, accessToken);
    return InstacartOrderSchema.parse(data);
  }

  /**
   * Get order history
   */
  async getOrderHistory(
    accessToken: string,
    options: { page?: number; perPage?: number } = {}
  ): Promise<InstacartOrdersResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page.toString());
    if (options.perPage) params.set('per_page', options.perPage.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.makeRequest<unknown>(`/orders${query}`, accessToken);
    return InstacartOrdersResponseSchema.parse(data);
  }

  /**
   * Get shopper location for an order
   */
  async getShopperLocation(
    accessToken: string,
    orderId: string
  ): Promise<{
    lat: number;
    lng: number;
    heading?: number;
    updatedAt?: string;
  } | null> {
    try {
      const data = await this.makeRequest<{
        location?: {
          lat: number;
          lng: number;
          heading?: number;
          updated_at?: string;
        };
      }>(`/orders/${orderId}/fulfillment`, accessToken);

      if (data.location) {
        return {
          lat: data.location.lat,
          lng: data.location.lng,
          heading: data.location.heading,
          updatedAt: data.location.updated_at,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Make authenticated request to Instacart API
   */
  private async makeRequest<T>(
    endpoint: string,
    accessToken: string,
    options: {
      method?: string;
      body?: unknown;
      timeout?: number;
    } = {}
  ): Promise<T> {
    // Check rate limit
    if (this.rateLimiter) {
      const rateLimitResult = await checkRateLimit(this.rateLimiter, 'instacart-api');
      if (!rateLimitResult.success) {
        throw new PlatformRateLimitError(
          this.platform,
          Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        );
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout ?? 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle error responses
        if (response.status === 401 || response.status === 403) {
          throw new PlatformAuthError(this.platform);
        }

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') ?? '60', 10);
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
    return withRetry(fetchFn, 3, 1000);
  }
}

/**
 * Singleton instance
 */
let clientInstance: InstacartApiClient | null = null;

/**
 * Get Instacart API client instance
 */
export function getInstacartClient(): InstacartApiClient {
  if (!clientInstance) {
    clientInstance = new InstacartApiClient();
  }
  return clientInstance;
}
