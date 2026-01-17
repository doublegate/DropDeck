import crypto from 'node:crypto';
import { PlatformAdapter } from '../base';
import type { AdapterConnection, AdapterMetadata, TokenSet, WebhookPayload } from '../types';
import type { DeliveryStatus, UnifiedDelivery, DriverLocation, OrderItem } from '@/types/delivery';
import { getInstacartClient, type InstacartApiClient } from './client';
import { instacartStatusMap } from '../status-map';
import { maskPhoneNumber, parseDate } from '../utils';
import {
  InstacartWebhookPayloadSchema,
  type InstacartOrder,
  type InstacartWebhookPayload,
} from './types';

/**
 * Instacart Platform Adapter
 *
 * Implements OAuth 2.0 authentication and order tracking for Instacart Connect API.
 * Also supports Costco orders which are fulfilled through Instacart.
 */
export class InstacartAdapter extends PlatformAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'instacart',
    displayName: 'Instacart',
    iconUrl: '/icons/instacart.svg',
    primaryColor: '#43B02A',
    capabilities: {
      oauth: true,
      webhooks: true,
      liveLocation: true,
      driverContact: true,
      sessionAuth: false,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 30,
    maxPollingInterval: 300,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://connect.instacart.com/v2',
    authorizationUrl: 'https://connect.instacart.com/oauth/authorize',
    tokenUrl: 'https://connect.instacart.com/oauth/token',
  };

  private client: InstacartApiClient;
  private webhookSecret: string;

  constructor() {
    super();
    this.client = getInstacartClient();
    this.webhookSecret = process.env.INSTACART_WEBHOOK_SECRET ?? '';
  }

  // ============================================
  // OAuth Methods
  // ============================================

  override supportsOAuth(): boolean {
    return true;
  }

  override async getOAuthUrl(_userId: string, state: string): Promise<string> {
    return this.client.getAuthorizationUrl(state);
  }

  override async exchangeCode(code: string): Promise<TokenSet> {
    const response = await this.client.exchangeCode(code);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
      scope: response.scope,
    };
  }

  override async refreshToken(refreshToken: string): Promise<TokenSet> {
    const response = await this.client.refreshToken(refreshToken);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
      scope: response.scope,
    };
  }

  override async revokeToken(accessToken: string): Promise<void> {
    await this.client.revokeToken(accessToken);
  }

  override async testConnection(accessToken: string): Promise<void> {
    await this.client.testConnection(accessToken);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const response = await this.client.getActiveOrders(connection.accessToken);
    return response.orders.map((order) => this.normalizeOrder(order));
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    // Extract external order ID from our internal ID format
    const externalId = deliveryId.startsWith('in_') ? deliveryId.slice(3) : deliveryId;
    const order = await this.client.getOrder(connection.accessToken, externalId);

    // Also fetch shopper location if available
    const location = await this.client.getShopperLocation(connection.accessToken, externalId);
    if (location && order.shopper) {
      order.shopper.location = {
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        updated_at: location.updatedAt,
      };
    }

    return this.normalizeOrder(order);
  }

  /**
   * Get order history
   */
  async getOrderHistory(
    connection: AdapterConnection,
    options: { page?: number; perPage?: number } = {}
  ): Promise<UnifiedDelivery[]> {
    const response = await this.client.getOrderHistory(connection.accessToken, options);
    return response.orders.map((order) => this.normalizeOrder(order));
  }

  // ============================================
  // Webhook Methods
  // ============================================

  override supportsWebhooks(): boolean {
    return true;
  }

  override verifyWebhook(payload: unknown, signature: string | null): boolean {
    if (!signature || !this.webhookSecret) {
      return false;
    }

    try {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  override normalizeWebhookPayload(payload: WebhookPayload): UnifiedDelivery | null {
    try {
      const parsed = InstacartWebhookPayloadSchema.parse(payload.data);
      return this.normalizeWebhookData(parsed);
    } catch {
      return null;
    }
  }

  // ============================================
  // Status Mapping
  // ============================================

  mapStatus(platformStatus: string): DeliveryStatus {
    const normalized = platformStatus.toLowerCase().replace(/[- ]/g, '_');
    return instacartStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Normalize Instacart order to UnifiedDelivery format
   */
  private normalizeOrder(order: InstacartOrder): UnifiedDelivery {
    const status = this.mapStatus(order.status);
    const now = new Date();

    // Parse delivery window
    const deliveryWindow = order.estimated_delivery || order.delivery_window;
    const estimatedArrival = deliveryWindow
      ? new Date(deliveryWindow.end)
      : new Date(Date.now() + 60 * 60 * 1000); // Default 1 hour

    const minutesRemaining = Math.max(
      0,
      Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
    );

    // Build driver location
    let driverLocation: DriverLocation | undefined;
    if (order.shopper?.location) {
      driverLocation = {
        lat: order.shopper.location.lat,
        lng: order.shopper.location.lng,
        heading: order.shopper.location.heading,
        speed: order.shopper.location.speed,
        timestamp: order.shopper.location.updated_at
          ? new Date(order.shopper.location.updated_at)
          : now,
      };
    }

    // Build order items
    const items: OrderItem[] | undefined = order.items?.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      imageUrl: item.image_url,
      substituted: item.replaced,
      substitutedWith: item.replacement_item?.name,
    }));

    // Detect if this is a Costco order
    const isCostco =
      order.retailer?.slug === 'costco' || order.retailer?.name?.toLowerCase().includes('costco');

    return {
      id: this.generateDeliveryId(order.id),
      platform: isCostco ? 'costco' : 'instacart',
      externalOrderId: order.id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.updated_at) ?? now,

      driver: order.shopper
        ? {
            name: order.shopper.first_name,
            photo: order.shopper.photo_url,
            phone: order.shopper.phone_number
              ? maskPhoneNumber(order.shopper.phone_number)
              : undefined,
            rating: order.shopper.rating,
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: this.formatAddress(order.delivery_address),
        addressLine1: order.delivery_address.street_address,
        city: order.delivery_address.city,
        state: order.delivery_address.state,
        zipCode: order.delivery_address.postal_code,
        lat: order.delivery_address.latitude ?? 0,
        lng: order.delivery_address.longitude ?? 0,
        instructions: order.delivery_address.delivery_instructions,
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
        url: order.tracking_url,
        mapAvailable: !!order.shopper?.location,
        liveUpdates: status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: !!order.shopper?.phone_number,
      },

      timestamps: {
        ordered: parseDate(order.created_at) ?? now,
        confirmed: status !== 'preparing' ? (parseDate(order.updated_at) ?? undefined) : undefined,
        driverAssigned: order.shopper ? (parseDate(order.updated_at) ?? undefined) : undefined,
        delivered: parseDate(order.delivered_at) ?? undefined,
        cancelled: parseDate(order.cancelled_at) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'instacart',
        rawData: order,
      },
    };
  }

  /**
   * Normalize webhook data to UnifiedDelivery
   */
  private normalizeWebhookData(webhook: InstacartWebhookPayload): UnifiedDelivery | null {
    const { data } = webhook;

    // If we have full order data, normalize it
    if (data.order) {
      return this.normalizeOrder(data.order);
    }

    // If we only have partial data (location update, status update), we can't create a full delivery
    // The webhook handler will need to merge this with cached data
    return null;
  }

  /**
   * Format address for display
   */
  private formatAddress(address: {
    street_address: string;
    street_address_2?: string;
    city: string;
    state: string;
    postal_code: string;
  }): string {
    const parts = [
      address.street_address,
      address.street_address_2,
      `${address.city}, ${address.state} ${address.postal_code}`,
    ].filter(Boolean);

    return parts.join(', ');
  }
}

/**
 * Export singleton instance
 */
export const instacartAdapter = new InstacartAdapter();

/**
 * Costco Adapter (via Instacart)
 *
 * Costco uses Instacart for delivery, so this is just an alias.
 * The adapter will detect Costco orders based on retailer data.
 */
export class CostcoAdapter extends InstacartAdapter {
  override readonly metadata: AdapterMetadata = {
    platformId: 'costco',
    displayName: 'Costco',
    iconUrl: '/icons/costco.svg',
    primaryColor: '#E31837',
    capabilities: {
      oauth: true,
      webhooks: true,
      liveLocation: true,
      driverContact: true,
      sessionAuth: false,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 30,
    maxPollingInterval: 300,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://connect.instacart.com/v2',
    authorizationUrl: 'https://connect.instacart.com/oauth/authorize',
    tokenUrl: 'https://connect.instacart.com/oauth/token',
  };
}

export const costcoAdapter = new CostcoAdapter();
