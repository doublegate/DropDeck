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
import { samsclubStatusMap } from '../status-map';
import type { AdapterConnection, AdapterMetadata, TokenSet } from '../types';
import { maskPhoneNumber, parseDate, withRetry } from '../utils';

// Note: Sam's Club may delegate some orders to Instacart for fulfillment.
// The normalizeInstacartOrder method handles this by adding a fulfilledByInstacart flag.

// ============================================
// Sam's Club Types
// ============================================

const SamsClubOrderItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number().optional(),
  image_url: z.string().optional(),
  sku: z.string().optional(),
});

const SamsClubDriverSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

const SamsClubOrderSchema = z.object({
  order_id: z.string(),
  order_number: z.string().optional(),
  status: z.string(),
  order_type: z.string().optional(), // 'DELIVERY', 'CLUB_PICKUP', 'CURBSIDE'
  fulfillment_partner: z.string().optional(), // 'INSTACART', 'SAMSCLUB', etc.
  items: z.array(SamsClubOrderItemSchema).optional(),
  items_count: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().default('USD'),
  club: z
    .object({
      id: z.string(),
      name: z.string(),
      address: z.string().optional(),
    })
    .optional(),
  delivery_address: z
    .object({
      street_address: z.string(),
      city: z.string(),
      state: z.string(),
      postal_code: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  delivery_instructions: z.string().optional(),
  delivery_window: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  driver: SamsClubDriverSchema.optional(),
  eta_minutes: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  delivered_at: z.string().optional(),
  picked_up_at: z.string().optional(),
});

type SamsClubOrder = z.infer<typeof SamsClubOrderSchema>;

interface SamsClubSessionData {
  cookies: Record<string, string>;
  membershipId?: string;
  userAgent: string;
}

/**
 * Sam's Club Platform Adapter
 *
 * Implements session-based authentication for Sam's Club order tracking.
 * Many Sam's Club orders are fulfilled via Instacart, so this adapter
 * delegates to the Instacart adapter when appropriate.
 */
export class SamsClubAdapter extends SessionBasedAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'samsclub',
    displayName: "Sam's Club",
    iconUrl: '/icons/samsclub.svg',
    primaryColor: '#0067A0',
    capabilities: {
      oauth: false,
      webhooks: false,
      liveLocation: true,
      driverContact: false,
      sessionAuth: true,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 60,
    maxPollingInterval: 300,
    defaultPollingInterval: 120,
    apiBaseUrl: 'https://www.samsclub.com/api',
  };

  private readonly baseUrl = 'https://www.samsclub.com/api';
  private readonly rateLimiter = createPlatformRateLimiter('samsclub');

  // ============================================
  // Session-Based Auth Methods
  // ============================================

  async login(_email: string, _password: string): Promise<TokenSet> {
    throw new Error("Sam's Club login requires session capture. Please use the browser extension.");
  }

  async refreshSession(sessionDataJson: string): Promise<TokenSet> {
    // Validate that the session data is valid JSON
    JSON.parse(sessionDataJson) as SamsClubSessionData;
    await this.testConnection(sessionDataJson);

    return {
      accessToken: sessionDataJson,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  override async testConnection(accessToken: string): Promise<void> {
    const sessionData = JSON.parse(accessToken) as SamsClubSessionData;
    await this.makeRequest('/order/v1/orders?limit=1', sessionData);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const sessionData = JSON.parse(connection.accessToken) as SamsClubSessionData;
    const data = await this.makeRequest<{ orders: unknown[] }>(
      '/order/v1/orders?status=active',
      sessionData
    );
    const orders = z.array(SamsClubOrderSchema).parse(data.orders);

    const deliveries: UnifiedDelivery[] = [];

    for (const order of orders) {
      // Check if order is fulfilled by Instacart
      if (order.fulfillment_partner === 'INSTACART') {
        // Delegate to Instacart adapter for these orders
        deliveries.push(this.normalizeInstacartOrder(order));
      } else {
        deliveries.push(this.normalizeDirectOrder(order));
      }
    }

    return deliveries;
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    const sessionData = JSON.parse(connection.accessToken) as SamsClubSessionData;
    const orderId = deliveryId.startsWith('sa_') ? deliveryId.slice(3) : deliveryId;
    const data = await this.makeRequest<unknown>(`/order/v1/orders/${orderId}`, sessionData);
    const order = SamsClubOrderSchema.parse(data);

    // Fetch tracking if available
    if (order.order_type === 'DELIVERY' && order.status !== 'DELIVERED') {
      const tracking = await this.getDeliveryTracking(sessionData, orderId);
      if (tracking) {
        order.driver = order.driver ?? {};
        if (tracking.location) {
          order.driver.location = tracking.location;
        }
        order.eta_minutes = tracking.eta_minutes;
      }
    }

    if (order.fulfillment_partner === 'INSTACART') {
      return this.normalizeInstacartOrder(order);
    }
    return this.normalizeDirectOrder(order);
  }

  /**
   * Get club pickup orders
   */
  async getPickupOrders(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const deliveries = await this.getActiveDeliveries(connection);
    return deliveries.filter(
      (d) =>
        (d.meta.rawData as SamsClubOrder).order_type === 'CLUB_PICKUP' ||
        (d.meta.rawData as SamsClubOrder).order_type === 'CURBSIDE'
    );
  }

  private async getDeliveryTracking(
    sessionData: SamsClubSessionData,
    orderId: string
  ): Promise<{ location?: { latitude: number; longitude: number }; eta_minutes?: number } | null> {
    try {
      const data = await this.makeRequest<{
        tracking?: {
          driver_location?: { lat: number; lng: number };
          eta?: number;
        };
      }>(`/order/v1/orders/${orderId}/tracking`, sessionData);

      if (data.tracking) {
        return {
          location: data.tracking.driver_location
            ? {
                latitude: data.tracking.driver_location.lat,
                longitude: data.tracking.driver_location.lng,
              }
            : undefined,
          eta_minutes: data.tracking.eta,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // ============================================
  // HTTP Request Helper
  // ============================================

  private async makeRequest<T>(
    endpoint: string,
    sessionData: SamsClubSessionData,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    if (this.rateLimiter) {
      const result = await checkRateLimit(this.rateLimiter, 'samsclub-api');
      if (!result.success) {
        throw new PlatformRateLimitError('samsclub', Math.ceil((result.reset - Date.now()) / 1000));
      }
    }

    const cookieString = Object.entries(sessionData.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: {
            Cookie: cookieString,
            'User-Agent': sessionData.userAgent,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401 || response.status === 403) {
          throw new PlatformAuthError('samsclub');
        }
        if (response.status === 429) {
          throw new PlatformRateLimitError('samsclub', 120);
        }
        if (response.status >= 500) {
          throw new PlatformUnavailableError('samsclub');
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new PlatformNetworkError('samsclub', 'Request timeout');
        }
        throw error;
      }
    };

    return withRetry(fetchFn, 3, 2000);
  }

  // ============================================
  // Status Mapping
  // ============================================

  mapStatus(platformStatus: string): DeliveryStatus {
    const normalized = platformStatus.toLowerCase().replace(/[- ]/g, '_');
    return samsclubStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Normalize Instacart-fulfilled order
   * Uses Instacart branding and status mapping
   */
  private normalizeInstacartOrder(order: SamsClubOrder): UnifiedDelivery {
    const delivery = this.normalizeDirectOrder(order);

    // Override platform to show Sam's Club branding but note Instacart fulfillment
    delivery.meta.rawData = {
      ...(delivery.meta.rawData as object),
      fulfilledByInstacart: true,
    };

    return delivery;
  }

  /**
   * Normalize direct Sam's Club order
   */
  private normalizeDirectOrder(order: SamsClubOrder): UnifiedDelivery {
    const status = this.mapStatus(order.status);
    const now = new Date();
    const isPickup = order.order_type === 'CLUB_PICKUP' || order.order_type === 'CURBSIDE';

    // Parse delivery window
    let estimatedArrival = new Date(Date.now() + 60 * 60 * 1000);
    let minutesRemaining = 60;

    if (order.delivery_window) {
      estimatedArrival = new Date(order.delivery_window.end);
      minutesRemaining = Math.max(
        0,
        Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
      );
    } else if (order.eta_minutes) {
      minutesRemaining = order.eta_minutes;
      estimatedArrival = new Date(Date.now() + minutesRemaining * 60 * 1000);
    }

    // Build driver location
    let driverLocation: DriverLocation | undefined;
    if (order.driver?.location) {
      driverLocation = {
        lat: order.driver.location.latitude,
        lng: order.driver.location.longitude,
        timestamp: now,
      };
    }

    // Build order items
    const items: OrderItem[] | undefined = order.items?.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      imageUrl: item.image_url,
    }));

    // Format address
    const deliveryAddress = order.delivery_address;
    const clubAddress = order.club?.address;

    const formattedAddress =
      isPickup && clubAddress
        ? clubAddress
        : deliveryAddress
          ? [
              deliveryAddress.street_address,
              `${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.postal_code}`,
            ].join(', ')
          : '';

    return {
      id: this.generateDeliveryId(order.order_id),
      platform: 'samsclub',
      externalOrderId: order.order_id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.updated_at) ?? now,

      driver: order.driver
        ? {
            name: order.driver.name,
            phone: order.driver.phone ? maskPhoneNumber(order.driver.phone) : undefined,
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: formattedAddress,
        addressLine1: deliveryAddress?.street_address,
        city: deliveryAddress?.city,
        state: deliveryAddress?.state,
        zipCode: deliveryAddress?.postal_code,
        lat: deliveryAddress?.latitude ?? 0,
        lng: deliveryAddress?.longitude ?? 0,
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
        adapterId: 'samsclub',
        rawData: {
          ...order,
          isPickup,
          clubName: order.club?.name,
          fulfillmentPartner: order.fulfillment_partner,
        },
      },
    };
  }
}

export const samsclubAdapter = new SamsClubAdapter();
