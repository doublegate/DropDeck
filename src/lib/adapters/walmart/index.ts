import type { DeliveryStatus, DriverLocation, OrderItem, UnifiedDelivery } from '@/types/delivery';
import { SessionBasedAdapter } from '../base';
import { walmartStatusMap } from '../status-map';
import type { AdapterConnection, AdapterMetadata, TokenSet } from '../types';
import { maskLicensePlate, maskPhoneNumber, parseDate } from '../utils';
import { getWalmartClient, type WalmartApiClient } from './client';
import type { WalmartOrder, WalmartOrderType, WalmartSessionData } from './types';

/**
 * Walmart+ Platform Adapter
 *
 * Implements session-based authentication for Walmart+ order tracking.
 * Supports delivery, pickup, and express orders.
 */
export class WalmartAdapter extends SessionBasedAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'walmart',
    displayName: 'Walmart+',
    iconUrl: '/icons/walmart.svg',
    primaryColor: '#0071DC',
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
    apiBaseUrl: 'https://www.walmart.com/api',
  };

  private client: WalmartApiClient;

  constructor() {
    super();
    this.client = getWalmartClient();
  }

  // ============================================
  // Session-Based Auth Methods
  // ============================================

  /**
   * Login with email and password
   * Note: This is a placeholder - actual implementation would need
   * browser automation or official API access
   */
  async login(_email: string, _password: string): Promise<TokenSet> {
    // Session-based login requires browser automation
    // This would typically be done through a headless browser
    // For now, users must provide session cookies manually
    throw new Error(
      'Walmart login requires session cookies. Please use the browser extension to capture your session.'
    );
  }

  /**
   * Refresh session
   */
  async refreshSession(sessionDataJson: string): Promise<TokenSet> {
    try {
      const sessionData = JSON.parse(sessionDataJson) as WalmartSessionData;

      // Validate the session
      if (!this.client.validateSession(sessionData)) {
        throw new Error('Session is expired or invalid');
      }

      // Update last refreshed timestamp
      sessionData.lastRefreshed = new Date().toISOString();

      return {
        accessToken: JSON.stringify(sessionData),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
    } catch (error) {
      throw new Error(`Failed to refresh session: ${error}`);
    }
  }

  override async testConnection(accessToken: string): Promise<void> {
    const sessionData = JSON.parse(accessToken) as WalmartSessionData;
    await this.client.getActiveOrders(sessionData);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const sessionData = JSON.parse(connection.accessToken) as WalmartSessionData;
    const response = await this.client.getActiveOrders(sessionData);
    return response.orders.map((order) => this.normalizeOrder(order));
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    const sessionData = JSON.parse(connection.accessToken) as WalmartSessionData;

    // Extract order ID from our internal ID format
    const orderId = deliveryId.startsWith('wa_') ? deliveryId.slice(3) : deliveryId;
    const order = await this.client.getOrder(sessionData, orderId);

    // Fetch tracking info if it's a delivery order
    if (order.order_type === 'DELIVERY' || order.order_type === 'EXPRESS') {
      const tracking = await this.client.getDeliveryTracking(sessionData, orderId);
      if (tracking?.driver?.location) {
        order.driver = order.driver ?? {};
        order.driver.location = {
          latitude: tracking.driver.location.latitude,
          longitude: tracking.driver.location.longitude,
        };
        order.eta_minutes = tracking.driver.eta_minutes;
      }
    }

    return this.normalizeOrder(order);
  }

  /**
   * Get delivery orders only
   */
  async getDeliveryOrders(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const deliveries = await this.getActiveDeliveries(connection);
    return deliveries.filter(
      (d) =>
        (d.meta.rawData as WalmartOrder).order_type === 'DELIVERY' ||
        (d.meta.rawData as WalmartOrder).order_type === 'EXPRESS'
    );
  }

  /**
   * Get pickup orders only
   */
  async getPickupOrders(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const deliveries = await this.getActiveDeliveries(connection);
    return deliveries.filter((d) => (d.meta.rawData as WalmartOrder).order_type === 'PICKUP');
  }

  /**
   * Get available delivery slots
   */
  async getDeliverySlots(
    connection: AdapterConnection,
    storeId: string
  ): Promise<Array<{ slotId: string; startTime: string; endTime: string; type: string }>> {
    const sessionData = JSON.parse(connection.accessToken) as WalmartSessionData;
    return this.client.getDeliverySlots(sessionData, storeId);
  }

  // ============================================
  // Status Mapping
  // ============================================

  mapStatus(platformStatus: string): DeliveryStatus {
    const normalized = platformStatus.toLowerCase().replace(/[- ]/g, '_');
    return walmartStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Get order type
   */
  private getOrderType(order: WalmartOrder): WalmartOrderType {
    const type = order.order_type?.toUpperCase();
    if (type === 'EXPRESS') return 'express';
    if (type === 'PICKUP') return 'pickup';
    return 'delivery';
  }

  /**
   * Normalize Walmart order to UnifiedDelivery format
   */
  private normalizeOrder(order: WalmartOrder): UnifiedDelivery {
    const orderType = this.getOrderType(order);
    const status = this.mapStatus(order.status);
    const now = new Date();

    // Parse delivery window
    let estimatedArrival = new Date(Date.now() + 60 * 60 * 1000); // Default 1 hour
    let minutesRemaining = 60;

    if (order.delivery_slot) {
      estimatedArrival = new Date(order.delivery_slot.end_time);
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
        heading: order.driver.location.heading,
        speed: order.driver.location.speed,
        timestamp: order.driver.location.updated_at
          ? new Date(order.driver.location.updated_at)
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

    // Format address
    const address = order.delivery_address;
    const formattedAddress = address
      ? [
          address.address_line_1,
          address.address_line_2,
          `${address.city}, ${address.state} ${address.postal_code}`,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    // For pickup orders, use store address
    const pickupAddress = order.store?.address;
    const isPickup = orderType === 'pickup';

    return {
      id: this.generateDeliveryId(order.order_id),
      platform: 'walmart',
      externalOrderId: order.order_id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.updated_at) ?? now,

      driver: order.driver
        ? {
            name: order.driver.name,
            photo: order.driver.photo_url,
            phone: order.driver.phone ? maskPhoneNumber(order.driver.phone) : undefined,
            vehicle: order.driver.vehicle
              ? {
                  make: order.driver.vehicle.make,
                  model: order.driver.vehicle.model,
                  color: order.driver.vehicle.color,
                  licensePlate: order.driver.vehicle.license_plate
                    ? maskLicensePlate(order.driver.vehicle.license_plate)
                    : undefined,
                }
              : undefined,
            location: driverLocation,
          }
        : undefined,

      destination:
        isPickup && pickupAddress
          ? {
              address: [
                pickupAddress.address_line_1,
                `${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.postal_code}`,
              ]
                .filter(Boolean)
                .join(', '),
              addressLine1: pickupAddress.address_line_1,
              city: pickupAddress.city,
              state: pickupAddress.state,
              zipCode: pickupAddress.postal_code,
              lat: pickupAddress.latitude ?? 0,
              lng: pickupAddress.longitude ?? 0,
            }
          : {
              address: formattedAddress,
              addressLine1: address?.address_line_1,
              city: address?.city,
              state: address?.state,
              zipCode: address?.postal_code,
              lat: address?.latitude ?? 0,
              lng: address?.longitude ?? 0,
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
        url: order.tracking_url,
        mapAvailable: !!order.driver?.location,
        liveUpdates:
          orderType === 'express' || status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: !!order.driver?.phone,
      },

      timestamps: {
        ordered: parseDate(order.created_at) ?? now,
        confirmed:
          order.status !== 'ORDER_PLACED' ? (parseDate(order.updated_at) ?? undefined) : undefined,
        driverAssigned: order.driver ? (parseDate(order.updated_at) ?? undefined) : undefined,
        delivered: parseDate(order.delivered_at) ?? undefined,
        cancelled: parseDate(order.cancelled_at) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'walmart',
        rawData: {
          ...order,
          orderType,
          isPickup,
          storeName: order.store?.name,
        },
      },
    };
  }
}

/**
 * Export singleton instance
 */
export const walmartAdapter = new WalmartAdapter();
