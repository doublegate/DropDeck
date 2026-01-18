import crypto from 'node:crypto';
import { checkRateLimit, createPlatformRateLimiter } from '@/lib/ratelimit';
import {
  PlatformAuthError,
  PlatformDataError,
  PlatformNetworkError,
  PlatformRateLimitError,
  PlatformUnavailableError,
} from '../errors';
import { withRetry } from '../utils';
import {
  type PKCEChallenge,
  type UberEatsOrder,
  UberEatsOrderSchema,
  type UberEatsOrdersResponse,
  UberEatsOrdersResponseSchema,
  type UberEatsTokenResponse,
  UberEatsTokenResponseSchema,
} from './types';

/**
 * Base64 URL encoding (RFC 4648)
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Uber Eats API Client
 * Handles OAuth 2.0 with PKCE and Eats API communication
 */
export class UberEatsApiClient {
  private readonly baseUrl = 'https://api.uber.com/v1';
  private readonly authUrl = 'https://auth.uber.com/oauth/v2';
  private readonly rateLimiter = createPlatformRateLimiter('ubereats');
  private readonly platform = 'ubereats' as const;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  // PKCE challenge storage (in-memory, should be Redis in production)
  private pkceStore = new Map<string, PKCEChallenge>();

  constructor() {
    const clientId = process.env.UBER_CLIENT_ID;
    const clientSecret = process.env.UBER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('UBER_CLIENT_ID and UBER_CLIENT_SECRET are required');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/ubereats`;
  }

  /**
   * Generate PKCE code verifier (43-128 characters, RFC 7636)
   */
  private generateCodeVerifier(): string {
    return base64UrlEncode(crypto.randomBytes(32));
  }

  /**
   * Generate PKCE code challenge (SHA256 of verifier, base64url encoded)
   */
  private generateCodeChallenge(verifier: string): string {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
  }

  /**
   * Get OAuth authorization URL with PKCE
   */
  getAuthorizationUrl(state: string): { url: string; codeVerifier: string } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    // Store PKCE challenge
    this.pkceStore.set(state, {
      codeVerifier,
      codeChallenge,
      createdAt: new Date(),
    });

    // Clean up old challenges (older than 10 minutes)
    const now = Date.now();
    for (const [key, value] of this.pkceStore.entries()) {
      if (now - value.createdAt.getTime() > 10 * 60 * 1000) {
        this.pkceStore.delete(key);
      }
    }

    const scopes = ['eats.order', 'eats.store.orders.read', 'delivery.status'];
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      url: `${this.authUrl}/authorize?${params.toString()}`,
      codeVerifier,
    };
  }

  /**
   * Get stored PKCE verifier for a state
   */
  getPKCEVerifier(state: string): string | null {
    const challenge = this.pkceStore.get(state);
    if (challenge) {
      this.pkceStore.delete(state); // One-time use
      return challenge.codeVerifier;
    }
    return null;
  }

  /**
   * Exchange authorization code for tokens (with PKCE)
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<UberEatsTokenResponse> {
    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
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
    return UberEatsTokenResponseSchema.parse(data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<UberEatsTokenResponse> {
    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
    return UberEatsTokenResponseSchema.parse(data);
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    await fetch(`${this.authUrl}/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
  async getActiveOrders(accessToken: string): Promise<UberEatsOrdersResponse> {
    const data = await this.makeRequest<unknown>('/eats/orders?status=active', accessToken);
    return UberEatsOrdersResponseSchema.parse(data);
  }

  /**
   * Get order by ID
   */
  async getOrder(accessToken: string, orderId: string): Promise<UberEatsOrder> {
    const data = await this.makeRequest<unknown>(`/eats/orders/${orderId}`, accessToken);
    return UberEatsOrderSchema.parse(data);
  }

  /**
   * Get order history
   */
  async getOrderHistory(
    accessToken: string,
    options: { pageToken?: string } = {}
  ): Promise<UberEatsOrdersResponse> {
    const params = new URLSearchParams();
    if (options.pageToken) params.set('page_token', options.pageToken);

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.makeRequest<unknown>(`/eats/orders${query}`, accessToken);
    return UberEatsOrdersResponseSchema.parse(data);
  }

  /**
   * Get order tracking (courier location)
   */
  async getOrderTracking(
    accessToken: string,
    orderId: string
  ): Promise<{
    courier?: {
      location?: { latitude: number; longitude: number; bearing?: number };
      eta_minutes?: number;
    };
  } | null> {
    try {
      const data = await this.makeRequest<{
        courier?: {
          location?: { latitude: number; longitude: number; bearing?: number };
        };
        delivery_eta?: { estimated_minutes?: number };
      }>(`/eats/orders/${orderId}/tracking`, accessToken);

      return {
        courier: data.courier
          ? {
              location: data.courier.location,
              eta_minutes: data.delivery_eta?.estimated_minutes,
            }
          : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Make authenticated request to Uber API
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
      const rateLimitResult = await checkRateLimit(this.rateLimiter, 'ubereats-api');
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
let clientInstance: UberEatsApiClient | null = null;

/**
 * Get Uber Eats API client instance
 */
export function getUberEatsClient(): UberEatsApiClient {
  if (!clientInstance) {
    clientInstance = new UberEatsApiClient();
  }
  return clientInstance;
}
