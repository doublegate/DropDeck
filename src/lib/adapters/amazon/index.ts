import type { DeliveryStatus, DriverLocation, OrderItem, UnifiedDelivery } from '@/types/delivery';
import { PlatformAdapter } from '../base';
import { amazonStatusMap } from '../status-map';
import type { AdapterConnection, AdapterMetadata, TokenSet } from '../types';
import { parseDate } from '../utils';
import { type AmazonApiClient, getAmazonClient } from './client';
import type { AmazonOrder, AmazonOrderType, AmazonShipment } from './types';
import { AMAZON_CARRIERS } from './types';

/**
 * Amazon Platform Adapter
 *
 * Implements OAuth 2.0 with AWS Signature V4 for SP-API communication.
 * Supports Amazon packages, Amazon Fresh, and Whole Foods orders.
 */
export class AmazonAdapter extends PlatformAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'amazon',
    displayName: 'Amazon',
    iconUrl: '/icons/amazon.svg',
    primaryColor: '#FF9900',
    capabilities: {
      oauth: true,
      webhooks: false, // Amazon uses polling
      liveLocation: true,
      driverContact: false,
      sessionAuth: false,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 60,
    maxPollingInterval: 300,
    defaultPollingInterval: 120,
    apiBaseUrl: 'https://sellingpartnerapi-na.amazon.com',
    authorizationUrl: 'https://sellercentral.amazon.com/apps/authorize/consent',
    tokenUrl: 'https://api.amazon.com/auth/o2/token',
  };

  private client: AmazonApiClient;

  constructor() {
    super();
    this.client = getAmazonClient();
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
    };
  }

  override async refreshToken(refreshToken: string): Promise<TokenSet> {
    const response = await this.client.refreshToken(refreshToken);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token ?? refreshToken,
      expiresAt: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
    };
  }

  override async testConnection(accessToken: string): Promise<void> {
    await this.client.testConnection(accessToken);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    // Get orders that are not yet delivered
    const response = await this.client.getOrders(connection.accessToken, {
      statuses: ['Pending', 'Unshipped', 'PartiallyShipped', 'Shipped'],
    });

    const deliveries: UnifiedDelivery[] = [];

    for (const order of response.orders) {
      // Get order items
      const itemsResponse = await this.client.getOrderItems(connection.accessToken, order.order_id);
      order.shipments = order.shipments ?? [];

      // Add items to order if not present
      if (!order.shipments[0]?.items) {
        if (order.shipments[0]) {
          order.shipments[0].items = itemsResponse.items.map((item) => ({
            asin: item.asin,
            title: item.title,
            quantity: item.quantity,
          }));
        }
      }

      // Each shipment becomes a separate delivery
      if (order.shipments.length > 0) {
        for (const shipment of order.shipments) {
          deliveries.push(this.normalizeOrder(order, shipment));
        }
      } else {
        // No shipments yet, create a pending delivery
        deliveries.push(this.normalizeOrder(order));
      }
    }

    return deliveries;
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    // Extract order ID and optionally shipment ID from our internal ID
    // Format: am_ORDER_ID or am_ORDER_ID_SHIPMENT_ID
    const parts = deliveryId.replace(/^am_/, '').split('_shipment_');
    const orderId = parts[0] ?? deliveryId;
    const shipmentId = parts[1];

    const order = await this.client.getOrder(connection.accessToken, orderId);

    // Get order items
    const itemsResponse = await this.client.getOrderItems(connection.accessToken, orderId);

    // Find specific shipment if provided
    let shipment: AmazonShipment | undefined;
    if (shipmentId && order.shipments) {
      shipment = order.shipments.find((s) => s.shipment_id === shipmentId);
    } else if (order.shipments?.length) {
      shipment = order.shipments[0];
    }

    if (shipment && !shipment.items) {
      shipment.items = itemsResponse.items.map((item) => ({
        asin: item.asin,
        title: item.title,
        quantity: item.quantity,
      }));
    }

    // Try to get real-time tracking if we have a tracking number
    if (shipment?.tracking_number) {
      const tracking = await this.client.getRealtimeTracking(
        connection.accessToken,
        shipment.tracking_number
      );

      if (tracking?.lastKnownLocation) {
        shipment.driver_location = {
          latitude: tracking.lastKnownLocation.latitude,
          longitude: tracking.lastKnownLocation.longitude,
        };
        shipment.stops_remaining = tracking.stopsRemaining;
      }
    }

    return this.normalizeOrder(order, shipment);
  }

  /**
   * Get Fresh orders specifically
   */
  async getFreshOrders(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const deliveries = await this.getActiveDeliveries(connection);
    return deliveries.filter((d) => d.platform === 'amazon_fresh');
  }

  /**
   * Get Whole Foods orders
   */
  async getWholeFoodsOrders(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const deliveries = await this.getActiveDeliveries(connection);
    return deliveries.filter((d) => (d.meta.rawData as AmazonOrder)?.merchant === 'WHOLE_FOODS');
  }

  // ============================================
  // Webhook Methods (Amazon doesn't support webhooks)
  // ============================================

  override supportsWebhooks(): boolean {
    return false;
  }

  // ============================================
  // Status Mapping
  // ============================================

  mapStatus(platformStatus: string): DeliveryStatus {
    const normalized = platformStatus.toLowerCase().replace(/[- ]/g, '_');
    return amazonStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Detect order type (package, Fresh, or Whole Foods)
   */
  private getOrderType(order: AmazonOrder): AmazonOrderType {
    if (order.merchant === 'WHOLE_FOODS') return 'whole_foods';
    if (order.delivery_type === 'SAME_DAY' && order.category === 'GROCERY') return 'fresh';
    if (order.order_type?.includes('Fresh')) return 'fresh';
    if (order.order_type?.includes('WholeFoods')) return 'whole_foods';
    return 'package';
  }

  /**
   * Get platform ID based on order type
   */
  private getPlatformId(orderType: AmazonOrderType): 'amazon' | 'amazon_fresh' {
    if (orderType === 'fresh' || orderType === 'whole_foods') {
      return 'amazon_fresh';
    }
    return 'amazon';
  }

  /**
   * Normalize Amazon order to UnifiedDelivery format
   */
  private normalizeOrder(order: AmazonOrder, shipment?: AmazonShipment): UnifiedDelivery {
    const orderType = this.getOrderType(order);
    const platformId = this.getPlatformId(orderType);
    const status = this.mapStatus(shipment?.status ?? order.order_status);
    const now = new Date();

    // Build delivery ID
    const deliveryIdSuffix = shipment?.shipment_id ? `_shipment_${shipment.shipment_id}` : '';
    const deliveryId = this.generateDeliveryId(`${order.order_id}${deliveryIdSuffix}`);

    // Parse delivery window
    let estimatedArrival = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
    if (shipment?.delivery_window) {
      estimatedArrival = new Date(shipment.delivery_window.end_time);
    } else if (shipment?.promised_delivery_date) {
      estimatedArrival = new Date(shipment.promised_delivery_date);
    }

    const minutesRemaining = Math.max(
      0,
      Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
    );

    // Build driver location
    let driverLocation: DriverLocation | undefined;
    if (shipment?.driver_location) {
      driverLocation = {
        lat: shipment.driver_location.latitude,
        lng: shipment.driver_location.longitude,
        timestamp: shipment.driver_location.timestamp
          ? new Date(shipment.driver_location.timestamp)
          : now,
      };
    }

    // Build order items
    const items: OrderItem[] | undefined = shipment?.items?.map((item) => ({
      name: item.title,
      quantity: item.quantity,
      unitPrice: item.price?.amount,
      imageUrl: item.image_url,
      substituted: item.is_substitution,
      substitutedWith: item.original_item?.title,
    }));

    // Format address
    const address = order.shipping_address;
    const formattedAddress = address
      ? [
          address.address_line_1,
          address.address_line_2,
          address.address_line_3,
          `${address.city}, ${address.state_or_region} ${address.postal_code}`,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    // Get carrier name
    const carrierName = shipment?.carrier
      ? (AMAZON_CARRIERS[shipment.carrier as keyof typeof AMAZON_CARRIERS] ?? shipment.carrier)
      : undefined;

    return {
      id: deliveryId,
      platform: platformId,
      externalOrderId: order.order_id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.last_update_date) ?? now,

      driver: driverLocation
        ? {
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: formattedAddress,
        addressLine1: address?.address_line_1,
        city: address?.city,
        state: address?.state_or_region,
        zipCode: address?.postal_code,
        lat: address?.latitude ?? 0,
        lng: address?.longitude ?? 0,
        instructions: order.delivery_instructions,
      },

      eta: {
        estimatedArrival,
        minutesRemaining,
        stopsRemaining: shipment?.stops_remaining,
        confidence: shipment?.driver_location ? 'high' : 'medium',
      },

      order: {
        itemCount: items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
        totalAmount: order.total?.amount,
        currency: order.total?.currency ?? 'USD',
        items,
      },

      tracking: {
        url: shipment?.tracking_number
          ? `https://www.amazon.com/gp/your-account/ship-track?orderId=${order.order_id}`
          : undefined,
        mapAvailable: !!shipment?.driver_location,
        liveUpdates: status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: false,
      },

      timestamps: {
        ordered: parseDate(order.purchase_date) ?? now,
        confirmed:
          order.order_status !== 'Pending'
            ? (parseDate(order.last_update_date) ?? undefined)
            : undefined,
        outForDelivery:
          shipment?.status === 'OUT_FOR_DELIVERY'
            ? (parseDate(order.last_update_date) ?? undefined)
            : undefined,
        delivered: parseDate(shipment?.actual_delivery_date) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'amazon',
        rawData: {
          order,
          shipment,
          orderType,
          carrier: carrierName,
        },
      },
    };
  }
}

/**
 * Amazon Fresh Adapter (extends Amazon adapter)
 * Used for Fresh and Whole Foods orders specifically
 */
export class AmazonFreshAdapter extends AmazonAdapter {
  override readonly metadata: AdapterMetadata = {
    platformId: 'amazon_fresh',
    displayName: 'Amazon Fresh',
    iconUrl: '/icons/amazon-fresh.svg',
    primaryColor: '#00A8E1',
    capabilities: {
      oauth: true,
      webhooks: false,
      liveLocation: true,
      driverContact: false,
      sessionAuth: false,
      orderItems: true,
      etaUpdates: true,
    },
    minPollingInterval: 30, // Fresh orders need more frequent updates
    maxPollingInterval: 120,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://sellingpartnerapi-na.amazon.com',
  };

  override async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    // Only return Fresh and Whole Foods orders
    return super.getFreshOrders(connection);
  }
}

/**
 * Export singleton instances
 */
export const amazonAdapter = new AmazonAdapter();
export const amazonFreshAdapter = new AmazonFreshAdapter();
