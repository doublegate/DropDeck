import * as jose from 'jose';
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
  type DoorDashDeliveriesResponse,
  DoorDashDeliveriesResponseSchema,
  type DoorDashDelivery,
  DoorDashDeliverySchema,
} from './types';

/**
 * DoorDash API Client
 * Handles JWT-based authentication and Drive API communication
 */
export class DoorDashApiClient {
  private readonly baseUrl = 'https://openapi.doordash.com';
  private readonly rateLimiter = createPlatformRateLimiter('doordash');
  private readonly platform = 'doordash' as const;

  private readonly developerId: string;
  private readonly keyId: string;
  private readonly signingSecret: Uint8Array;

  // JWT cache to avoid regenerating for every request
  private jwtCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    const developerId = process.env.DOORDASH_DEVELOPER_ID;
    const keyId = process.env.DOORDASH_KEY_ID;
    const signingSecret = process.env.DOORDASH_SIGNING_SECRET;

    if (!developerId || !keyId || !signingSecret) {
      throw new Error(
        'DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, and DOORDASH_SIGNING_SECRET are required'
      );
    }

    this.developerId = developerId;
    this.keyId = keyId;
    this.signingSecret = new TextEncoder().encode(signingSecret);
  }

  /**
   * Generate JWT for DoorDash API authentication
   * Uses HS256 algorithm with DD-JWT-V1 version header
   */
  private async generateJWT(): Promise<string> {
    // Check cache first
    if (this.jwtCache && this.jwtCache.expiresAt > Date.now() + 30000) {
      return this.jwtCache.token;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 300; // 5 minutes

    const token = await new jose.SignJWT({
      aud: 'doordash',
      iss: this.developerId,
      kid: this.keyId,
    })
      .setProtectedHeader({
        alg: 'HS256',
        'dd-ver': 'DD-JWT-V1',
      } as jose.JWTHeaderParameters)
      .setIssuedAt(now)
      .setExpirationTime(expiresAt)
      .sign(this.signingSecret);

    // Cache the token
    this.jwtCache = {
      token,
      expiresAt: expiresAt * 1000,
    };

    return token;
  }

  /**
   * Get active deliveries
   */
  async getActiveDeliveries(): Promise<DoorDashDeliveriesResponse> {
    const data = await this.makeRequest<unknown>('/drive/v2/deliveries?status=active');
    return DoorDashDeliveriesResponseSchema.parse(data);
  }

  /**
   * Get delivery by external ID
   */
  async getDelivery(externalDeliveryId: string): Promise<DoorDashDelivery> {
    const data = await this.makeRequest<unknown>(`/drive/v2/deliveries/${externalDeliveryId}`);
    return DoorDashDeliverySchema.parse(data);
  }

  /**
   * Get delivery history
   */
  async getDeliveryHistory(
    options: { continuationToken?: string; limit?: number } = {}
  ): Promise<DoorDashDeliveriesResponse> {
    const params = new URLSearchParams();
    if (options.continuationToken) {
      params.set('continuation_token', options.continuationToken);
    }
    if (options.limit) {
      params.set('limit', options.limit.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.makeRequest<unknown>(`/drive/v2/deliveries${query}`);
    return DoorDashDeliveriesResponseSchema.parse(data);
  }

  /**
   * Make authenticated request to DoorDash API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: unknown;
      timeout?: number;
    } = {}
  ): Promise<T> {
    // Check rate limit
    if (this.rateLimiter) {
      const rateLimitResult = await checkRateLimit(this.rateLimiter, 'doordash-api');
      if (!rateLimitResult.success) {
        throw new PlatformRateLimitError(
          this.platform,
          Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        );
      }
    }

    const jwt = await this.generateJWT();
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout ?? 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle error responses
        if (response.status === 401 || response.status === 403) {
          // Clear JWT cache on auth error
          this.jwtCache = null;
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
let clientInstance: DoorDashApiClient | null = null;

/**
 * Get DoorDash API client instance
 */
export function getDoorDashClient(): DoorDashApiClient {
  if (!clientInstance) {
    clientInstance = new DoorDashApiClient();
  }
  return clientInstance;
}
