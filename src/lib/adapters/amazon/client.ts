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
  type AmazonOrder,
  AmazonOrderSchema,
  type AmazonOrdersResponse,
  AmazonOrdersResponseSchema,
  type AmazonRealtimeTracking,
  AmazonRealtimeTrackingSchema,
  type AmazonTokenResponse,
  AmazonTokenResponseSchema,
} from './types';

/**
 * AWS Signature V4 signing helper
 */
function getSignatureKey(
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Buffer {
  const kDate = crypto.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  return kSigning;
}

/**
 * Amazon Selling Partner API Client
 * Handles OAuth 2.0 and AWS Signature V4 for SP-API communication
 */
export class AmazonApiClient {
  private readonly spApiBaseUrl = 'https://sellingpartnerapi-na.amazon.com';
  private readonly authUrl = 'https://api.amazon.com/auth/o2/token';
  private readonly rateLimiter = createPlatformRateLimiter('amazon');
  private readonly platform = 'amazon' as const;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly awsAccessKeyId: string;
  private readonly awsSecretAccessKey: string;
  private readonly region: string;

  constructor() {
    const clientId = process.env.AMAZON_CLIENT_ID;
    const clientSecret = process.env.AMAZON_CLIENT_SECRET;
    const awsAccessKeyId = process.env.AMAZON_AWS_ACCESS_KEY_ID;
    const awsSecretAccessKey = process.env.AMAZON_AWS_SECRET_ACCESS_KEY;

    if (!clientId || !clientSecret) {
      throw new Error('AMAZON_CLIENT_ID and AMAZON_CLIENT_SECRET are required');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/amazon`;
    this.awsAccessKeyId = awsAccessKeyId ?? '';
    this.awsSecretAccessKey = awsSecretAccessKey ?? '';
    this.region = process.env.AMAZON_REGION ?? 'us-east-1';
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      application_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      version: 'beta',
    });

    return `https://sellercentral.amazon.com/apps/authorize/consent?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<AmazonTokenResponse> {
    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
    return AmazonTokenResponseSchema.parse(data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AmazonTokenResponse> {
    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
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
    return AmazonTokenResponseSchema.parse(data);
  }

  /**
   * Test connection with access token
   */
  async testConnection(accessToken: string): Promise<void> {
    // Simple test to verify the token works
    await this.getOrders(accessToken, { limit: 1 });
  }

  /**
   * Get orders
   */
  async getOrders(
    accessToken: string,
    options: {
      statuses?: string[];
      limit?: number;
      nextToken?: string;
    } = {}
  ): Promise<AmazonOrdersResponse> {
    const params = new URLSearchParams();

    if (options.statuses?.length) {
      params.set('OrderStatuses', options.statuses.join(','));
    }
    if (options.limit) {
      params.set('MaxResultsPerPage', options.limit.toString());
    }
    if (options.nextToken) {
      params.set('NextToken', options.nextToken);
    }

    // By default, get orders from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    params.set('CreatedAfter', thirtyDaysAgo.toISOString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const data = await this.makeSignedRequest<{ payload: unknown }>(
      `/orders/v0/orders${query}`,
      accessToken
    );

    return AmazonOrdersResponseSchema.parse(data.payload);
  }

  /**
   * Get order by ID
   */
  async getOrder(accessToken: string, orderId: string): Promise<AmazonOrder> {
    const data = await this.makeSignedRequest<{ payload: unknown }>(
      `/orders/v0/orders/${orderId}`,
      accessToken
    );
    return AmazonOrderSchema.parse(data.payload);
  }

  /**
   * Get order items
   */
  async getOrderItems(
    accessToken: string,
    orderId: string
  ): Promise<{ items: Array<{ asin?: string; title: string; quantity: number }> }> {
    try {
      const data = await this.makeSignedRequest<{
        payload: {
          OrderItems?: Array<{
            ASIN?: string;
            Title?: string;
            QuantityOrdered?: number;
          }>;
        };
      }>(`/orders/v0/orders/${orderId}/orderItems`, accessToken);

      return {
        items:
          data.payload.OrderItems?.map((item) => ({
            asin: item.ASIN,
            title: item.Title ?? 'Unknown item',
            quantity: item.QuantityOrdered ?? 1,
          })) ?? [],
      };
    } catch {
      return { items: [] };
    }
  }

  /**
   * Get real-time tracking for a package
   * Note: This may require additional authentication for consumer tracking
   */
  async getRealtimeTracking(
    accessToken: string,
    trackingId: string
  ): Promise<AmazonRealtimeTracking | null> {
    try {
      // This endpoint is based on security research of Amazon's internal API
      // It may require session-based authentication in practice
      const data = await this.makeSignedRequest<unknown>(
        `/shipping/v2/tracking?trackingId=${trackingId}`,
        accessToken
      );
      return AmazonRealtimeTrackingSchema.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Make a signed request to Amazon SP-API
   */
  private async makeSignedRequest<T>(
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
      const rateLimitResult = await checkRateLimit(this.rateLimiter, 'amazon-api');
      if (!rateLimitResult.success) {
        throw new PlatformRateLimitError(
          this.platform,
          Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
        );
      }
    }

    const url = `${this.spApiBaseUrl}${endpoint}`;
    const method = options.method ?? 'GET';
    const timeout = options.timeout ?? 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Prepare headers with AWS Signature V4 if credentials available
    const headers: Record<string, string> = {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Add AWS Signature V4 if credentials are configured
    if (this.awsAccessKeyId && this.awsSecretAccessKey) {
      const signedHeaders = this.signRequest(method, url, options.body);
      Object.assign(headers, signedHeaders);
    }

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method,
          headers,
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

  /**
   * Sign request with AWS Signature V4
   */
  private signRequest(method: string, url: string, body?: unknown): Record<string, string> {
    const parsedUrl = new URL(url);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const host = parsedUrl.host;
    const canonicalUri = parsedUrl.pathname;
    const canonicalQueryString = parsedUrl.searchParams.toString();

    const payloadHash = crypto
      .createHash('sha256')
      .update(body ? JSON.stringify(body) : '')
      .digest('hex');

    const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-date';

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.region}/execute-api/aws4_request`;

    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = getSignatureKey(
      this.awsSecretAccessKey,
      dateStamp,
      this.region,
      'execute-api'
    );

    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authorizationHeader = `${algorithm} Credential=${this.awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'x-amz-date': amzDate,
      Authorization: authorizationHeader,
    };
  }
}

/**
 * Singleton instance
 */
let clientInstance: AmazonApiClient | null = null;

/**
 * Get Amazon API client instance
 */
export function getAmazonClient(): AmazonApiClient {
  if (!clientInstance) {
    clientInstance = new AmazonApiClient();
  }
  return clientInstance;
}
