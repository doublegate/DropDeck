import { z } from 'zod';
import { checkRateLimit, createPlatformRateLimiter } from '@/lib/ratelimit';
import type { DeliveryStatus, DriverLocation, OrderItem, UnifiedDelivery } from '@/types/delivery';
import { SessionBasedAdapter } from '../base';
import {
  PlatformAuthError,
  PlatformNetworkError,
  PlatformRateLimitError,
  PlatformUnavailableError,
} from '../errors';
import { drizlyStatusMap } from '../status-map';
import type { AdapterConnection, AdapterMetadata, TokenSet } from '../types';
import { maskPhoneNumber, parseDate, withRetry } from '../utils';

// ============================================
// Drizly Types
// ============================================

const DrizlyDriverSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      bearing: z.number().optional(),
    })
    .optional(),
});

const DrizlyOrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
  image_url: z.string().optional(),
  size: z.string().optional(), // "750ml", "12-pack", etc.
  category: z.string().optional(), // "beer", "wine", "spirits"
});

const DrizlyOrderSchema = z.object({
  id: z.string(),
  order_number: z.string().optional(),
  status: z.string(),
  store: z
    .object({
      id: z.string(),
      name: z.string(),
      address: z.string().optional(),
    })
    .optional(),
  items: z.array(DrizlyOrderItemSchema).optional(),
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
  delivery_instructions: z.string().optional(),
  driver: DrizlyDriverSchema.optional(),
  eta_minutes: z.number().optional(),
  requires_id_verification: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
  delivered_at: z.string().optional(),
});

type DrizlyOrder = z.infer<typeof DrizlyOrderSchema>;

interface DrizlySessionData {
  token: string;
  userId?: string;
}

/**
 * Drizly Platform Adapter
 *
 * Implements session-based authentication for Drizly alcohol delivery tracking.
 * Note: Drizly is owned by Uber and may integrate with Uber infrastructure.
 */
export class DrizlyAdapter extends SessionBasedAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'drizly',
    displayName: 'Drizly',
    iconUrl: '/icons/drizly.svg',
    primaryColor: '#6B46C1',
    capabilities: {
      oauth: false,
      webhooks: false,
      liveLocation: true,
      driverContact: false,
      sessionAuth: true,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 30,
    maxPollingInterval: 180,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://api.drizly.com/v1',
  };

  private readonly baseUrl = 'https://api.drizly.com/v1';
  private readonly rateLimiter = createPlatformRateLimiter('drizly');

  // ============================================
  // Session-Based Auth Methods
  // ============================================

  async login(_email: string, _password: string): Promise<TokenSet> {
    throw new Error('Drizly login requires session capture. Please use the browser extension.');
  }

  async refreshSession(sessionDataJson: string): Promise<TokenSet> {
    // Validate that the session data is valid JSON
    JSON.parse(sessionDataJson) as DrizlySessionData;
    await this.testConnection(sessionDataJson);

    return {
      accessToken: sessionDataJson,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  override async testConnection(accessToken: string): Promise<void> {
    const sessionData = JSON.parse(accessToken) as DrizlySessionData;
    await this.makeRequest('/orders', sessionData);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const sessionData = JSON.parse(connection.accessToken) as DrizlySessionData;
    const data = await this.makeRequest<{ orders: unknown[] }>(
      '/orders?status=active',
      sessionData
    );
    const orders = z.array(DrizlyOrderSchema).parse(data.orders);
    return orders.map((order) => this.normalizeOrder(order));
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    const sessionData = JSON.parse(connection.accessToken) as DrizlySessionData;
    const orderId = deliveryId.startsWith('dr_') ? deliveryId.slice(3) : deliveryId;
    const data = await this.makeRequest<unknown>(`/orders/${orderId}`, sessionData);
    const order = DrizlyOrderSchema.parse(data);

    // Fetch tracking if driver is assigned
    if (order.driver) {
      const tracking = await this.getDriverTracking(sessionData, orderId);
      if (tracking?.location) {
        order.driver.location = tracking.location;
        order.eta_minutes = tracking.eta_minutes;
      }
    }

    return this.normalizeOrder(order);
  }

  private async getDriverTracking(
    sessionData: DrizlySessionData,
    orderId: string
  ): Promise<{ location?: { latitude: number; longitude: number }; eta_minutes?: number } | null> {
    try {
      const data = await this.makeRequest<{
        location?: { latitude: number; longitude: number };
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
    sessionData: DrizlySessionData,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    if (this.rateLimiter) {
      const result = await checkRateLimit(this.rateLimiter, 'drizly-api');
      if (!result.success) {
        throw new PlatformRateLimitError('drizly', Math.ceil((result.reset - Date.now()) / 1000));
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
          throw new PlatformAuthError('drizly');
        }
        if (response.status === 429) {
          throw new PlatformRateLimitError('drizly', 60);
        }
        if (response.status >= 500) {
          throw new PlatformUnavailableError('drizly');
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new PlatformNetworkError('drizly', 'Request timeout');
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
    return drizlyStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  private normalizeOrder(order: DrizlyOrder): UnifiedDelivery {
    const status = this.mapStatus(order.status);
    const now = new Date();

    const minutesRemaining = order.eta_minutes ?? 45;
    const estimatedArrival = new Date(Date.now() + minutesRemaining * 60 * 1000);

    let driverLocation: DriverLocation | undefined;
    if (order.driver?.location) {
      driverLocation = {
        lat: order.driver.location.latitude,
        lng: order.driver.location.longitude,
        heading: order.driver.location.bearing,
        timestamp: now,
      };
    }

    const items: OrderItem[] | undefined = order.items?.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      imageUrl: item.image_url,
    }));

    return {
      id: this.generateDeliveryId(order.id),
      platform: 'drizly',
      externalOrderId: order.id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.updated_at) ?? now,

      driver: order.driver
        ? {
            name: order.driver.name,
            photo: order.driver.photo_url,
            phone: order.driver.phone ? maskPhoneNumber(order.driver.phone) : undefined,
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
        instructions: order.delivery_instructions,
      },

      eta: {
        estimatedArrival,
        minutesRemaining,
        confidence: order.driver?.location ? 'high' : 'medium',
      },

      order: {
        itemCount: order.items_count ?? order.items?.length ?? 0,
        totalAmount: order.total,
        currency: order.currency,
        items,
        specialInstructions: order.requires_id_verification
          ? 'ID verification required upon delivery'
          : undefined,
      },

      tracking: {
        mapAvailable: !!order.driver?.location,
        liveUpdates: status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: !!order.driver?.phone,
      },

      timestamps: {
        ordered: parseDate(order.created_at) ?? now,
        driverAssigned: order.driver ? (parseDate(order.updated_at) ?? undefined) : undefined,
        delivered: parseDate(order.delivered_at) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'drizly',
        rawData: {
          ...order,
          requiresIdVerification: order.requires_id_verification,
          storeName: order.store?.name,
        },
      },
    };
  }
}

export const drizlyAdapter = new DrizlyAdapter();
