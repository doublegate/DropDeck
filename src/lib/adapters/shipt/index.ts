import { z } from 'zod';
import { SessionBasedAdapter } from '../base';
import type { AdapterConnection, AdapterMetadata, TokenSet } from '../types';
import type { DeliveryStatus, UnifiedDelivery, DriverLocation, OrderItem } from '@/types/delivery';
import { shiptStatusMap } from '../status-map';
import { maskPhoneNumber, parseDate, withRetry } from '../utils';
import { createPlatformRateLimiter, checkRateLimit } from '@/lib/ratelimit';
import {
  PlatformAuthError,
  PlatformRateLimitError,
  PlatformUnavailableError,
  PlatformNetworkError,
} from '../errors';

// ============================================
// Shipt Types
// ============================================

const ShiptShopperSchema = z.object({
  id: z.string().optional(),
  first_name: z.string(),
  photo_url: z.string().optional(),
  phone: z.string().optional(),
  rating: z.number().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      updated_at: z.string().optional(),
    })
    .optional(),
});

const ShiptOrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
  image_url: z.string().optional(),
  substituted: z.boolean().optional(),
  substituted_with: z.string().optional(),
});

const ShiptOrderSchema = z.object({
  id: z.string(),
  order_number: z.string().optional(),
  status: z.string(),
  retailer: z
    .object({
      id: z.string(),
      name: z.string(),
      logo_url: z.string().optional(),
    })
    .optional(),
  items: z.array(ShiptOrderItemSchema).optional(),
  items_count: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().default('USD'),
  delivery_address: z.object({
    street_address: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  delivery_window: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  shopper: ShiptShopperSchema.optional(),
  eta_minutes: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  delivered_at: z.string().optional(),
});

type ShiptOrder = z.infer<typeof ShiptOrderSchema>;

interface ShiptSessionData {
  token: string;
  refreshToken?: string;
  userId?: string;
  expiresAt?: string;
}

/**
 * Shipt Platform Adapter
 *
 * Implements session-based authentication for Shipt order tracking.
 * Also handles Target orders fulfilled via Shipt.
 */
export class ShiptAdapter extends SessionBasedAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'shipt',
    displayName: 'Shipt',
    iconUrl: '/icons/shipt.svg',
    primaryColor: '#00A859',
    capabilities: {
      oauth: false,
      webhooks: false,
      liveLocation: true,
      driverContact: true,
      sessionAuth: true,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 30,
    maxPollingInterval: 180,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://api.shipt.com/v1',
  };

  private readonly baseUrl = 'https://api.shipt.com/v1';
  private readonly rateLimiter = createPlatformRateLimiter('shipt');

  // ============================================
  // Session-Based Auth Methods
  // ============================================

  async login(_email: string, _password: string): Promise<TokenSet> {
    // Shipt login requires their mobile API
    // For now, users must provide session token
    throw new Error(
      'Shipt login requires the mobile app. Please use the browser extension to capture your session.'
    );
  }

  async refreshSession(sessionDataJson: string): Promise<TokenSet> {
    // Validate that the session data is valid JSON
    JSON.parse(sessionDataJson) as ShiptSessionData;

    // Validate the session by making a test request
    await this.testConnection(sessionDataJson);

    return {
      accessToken: sessionDataJson,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  override async testConnection(accessToken: string): Promise<void> {
    const sessionData = JSON.parse(accessToken) as ShiptSessionData;
    await this.makeRequest('/orders/active', sessionData);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const sessionData = JSON.parse(connection.accessToken) as ShiptSessionData;
    const data = await this.makeRequest<{ orders: unknown[] }>('/orders/active', sessionData);
    const orders = z.array(ShiptOrderSchema).parse(data.orders);
    return orders.map((order) => this.normalizeOrder(order));
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    const sessionData = JSON.parse(connection.accessToken) as ShiptSessionData;
    const orderId = deliveryId.startsWith('sh_') ? deliveryId.slice(3) : deliveryId;
    const data = await this.makeRequest<unknown>(`/orders/${orderId}`, sessionData);
    const order = ShiptOrderSchema.parse(data);

    // Fetch tracking if shopper is assigned
    if (order.shopper) {
      const tracking = await this.getShopperTracking(sessionData, orderId);
      if (tracking?.location) {
        order.shopper.location = tracking.location;
        order.eta_minutes = tracking.eta_minutes;
      }
    }

    return this.normalizeOrder(order);
  }

  /**
   * Get shopper tracking info
   */
  private async getShopperTracking(
    sessionData: ShiptSessionData,
    orderId: string
  ): Promise<{ location?: { lat: number; lng: number }; eta_minutes?: number } | null> {
    try {
      const data = await this.makeRequest<{
        location?: { lat: number; lng: number };
        eta?: number;
      }>(`/orders/${orderId}/tracking`, sessionData);

      return {
        location: data.location,
        eta_minutes: data.eta,
      };
    } catch {
      return null;
    }
  }

  // ============================================
  // HTTP Request Helper
  // ============================================

  private async makeRequest<T>(
    endpoint: string,
    sessionData: ShiptSessionData,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    if (this.rateLimiter) {
      const result = await checkRateLimit(this.rateLimiter, 'shipt-api');
      if (!result.success) {
        throw new PlatformRateLimitError('shipt', Math.ceil((result.reset - Date.now()) / 1000));
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: {
            Authorization: `Bearer ${sessionData.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401 || response.status === 403) {
          throw new PlatformAuthError('shipt');
        }
        if (response.status === 429) {
          throw new PlatformRateLimitError('shipt', 60);
        }
        if (response.status >= 500) {
          throw new PlatformUnavailableError('shipt');
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new PlatformNetworkError('shipt', 'Request timeout');
        }
        throw error;
      }
    };

    return withRetry(fetchFn, 3, 1000);
  }

  // ============================================
  // Status Mapping
  // ============================================

  mapStatus(platformStatus: string): DeliveryStatus {
    const normalized = platformStatus.toLowerCase().replace(/[- ]/g, '_');
    return shiptStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  private normalizeOrder(order: ShiptOrder): UnifiedDelivery {
    const status = this.mapStatus(order.status);
    const now = new Date();

    // Parse delivery window
    const deliveryWindow = order.delivery_window;
    const estimatedArrival = deliveryWindow
      ? new Date(deliveryWindow.end)
      : new Date(Date.now() + 60 * 60 * 1000);

    const minutesRemaining =
      order.eta_minutes ??
      Math.max(0, Math.round((estimatedArrival.getTime() - now.getTime()) / 60000));

    // Build driver location
    let driverLocation: DriverLocation | undefined;
    if (order.shopper?.location) {
      driverLocation = {
        lat: order.shopper.location.lat,
        lng: order.shopper.location.lng,
        timestamp: order.shopper.location.updated_at
          ? new Date(order.shopper.location.updated_at)
          : now,
      };
    }

    // Build order items
    const items: OrderItem[] | undefined = order.items?.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      imageUrl: item.image_url,
      substituted: item.substituted,
      substitutedWith: item.substituted_with,
    }));

    // Detect Target orders
    const isTarget = order.retailer?.name?.toLowerCase().includes('target');

    return {
      id: this.generateDeliveryId(order.id),
      platform: 'shipt',
      externalOrderId: order.id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.updated_at) ?? now,

      driver: order.shopper
        ? {
            name: order.shopper.first_name,
            photo: order.shopper.photo_url,
            phone: order.shopper.phone ? maskPhoneNumber(order.shopper.phone) : undefined,
            rating: order.shopper.rating,
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: [
          order.delivery_address.street_address,
          `${order.delivery_address.city}, ${order.delivery_address.state} ${order.delivery_address.postal_code}`,
        ].join(', '),
        addressLine1: order.delivery_address.street_address,
        city: order.delivery_address.city,
        state: order.delivery_address.state,
        zipCode: order.delivery_address.postal_code,
        lat: order.delivery_address.latitude ?? 0,
        lng: order.delivery_address.longitude ?? 0,
      },

      eta: {
        estimatedArrival,
        minutesRemaining,
        confidence: order.shopper?.location ? 'high' : 'medium',
      },

      order: {
        itemCount: order.items_count ?? order.items?.length ?? 0,
        totalAmount: order.total,
        currency: order.currency,
        items,
      },

      tracking: {
        mapAvailable: !!order.shopper?.location,
        liveUpdates: status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: !!order.shopper?.phone,
      },

      timestamps: {
        ordered: parseDate(order.created_at) ?? now,
        driverAssigned: order.shopper ? (parseDate(order.updated_at) ?? undefined) : undefined,
        delivered: parseDate(order.delivered_at) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'shipt',
        rawData: {
          ...order,
          isTarget,
          retailer: order.retailer?.name,
        },
      },
    };
  }
}

export const shiptAdapter = new ShiptAdapter();
