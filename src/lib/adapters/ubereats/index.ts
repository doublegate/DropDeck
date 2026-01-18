import crypto from 'node:crypto';
import type { DeliveryStatus, DriverLocation, OrderItem, UnifiedDelivery } from '@/types/delivery';
import { PlatformAdapter } from '../base';
import { ubereatsStatusMap } from '../status-map';
import type { AdapterConnection, AdapterMetadata, TokenSet, WebhookPayload } from '../types';
import { maskLicensePlate, maskPhoneNumber, parseDate } from '../utils';
import { getUberEatsClient, type UberEatsApiClient } from './client';
import {
  type UberEatsOrder,
  type UberEatsWebhookPayload,
  UberEatsWebhookPayloadSchema,
} from './types';

/**
 * Uber Eats Platform Adapter
 *
 * Implements OAuth 2.0 with PKCE for authentication and
 * Consumer Delivery API for order tracking.
 */
export class UberEatsAdapter extends PlatformAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'ubereats',
    displayName: 'Uber Eats',
    iconUrl: '/icons/ubereats.svg',
    primaryColor: '#06C167',
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
    maxPollingInterval: 120,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://api.uber.com/v1',
    authorizationUrl: 'https://auth.uber.com/oauth/v2/authorize',
    tokenUrl: 'https://auth.uber.com/oauth/v2/token',
  };

  private client: UberEatsApiClient;
  private webhookSecret: string;

  constructor() {
    super();
    this.client = getUberEatsClient();
    this.webhookSecret = process.env.UBER_WEBHOOK_SECRET ?? '';
  }

  // ============================================
  // OAuth Methods (with PKCE)
  // ============================================

  override supportsOAuth(): boolean {
    return true;
  }

  override async getOAuthUrl(_userId: string, state: string): Promise<string> {
    const { url } = this.client.getAuthorizationUrl(state);
    return url;
  }

  /**
   * Exchange code for tokens with PKCE verifier
   */
  async exchangeCodeWithPKCE(code: string, codeVerifier: string): Promise<TokenSet> {
    const response = await this.client.exchangeCode(code, codeVerifier);

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: new Date(Date.now() + response.expires_in * 1000),
      tokenType: response.token_type,
      scope: response.scope,
    };
  }

  override async exchangeCode(_code: string): Promise<TokenSet> {
    // This method is called without state, which is needed for PKCE
    // The callback handler should use exchangeCodeWithPKCE instead
    throw new Error('Use exchangeCodeWithPKCE with state parameter for PKCE flow');
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
    const externalId = deliveryId.startsWith('ub_') ? deliveryId.slice(3) : deliveryId;
    const order = await this.client.getOrder(connection.accessToken, externalId);

    // Also fetch tracking info for courier location
    const tracking = await this.client.getOrderTracking(connection.accessToken, externalId);
    if (tracking?.courier?.location && order.courier) {
      order.courier.location = {
        latitude: tracking.courier.location.latitude,
        longitude: tracking.courier.location.longitude,
        bearing: tracking.courier.location.bearing,
      };
    }

    return this.normalizeOrder(order);
  }

  /**
   * Get live tracking data for a delivery
   */
  async getLiveTracking(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<{ location?: DriverLocation; etaMinutes?: number } | null> {
    const externalId = deliveryId.startsWith('ub_') ? deliveryId.slice(3) : deliveryId;
    const tracking = await this.client.getOrderTracking(connection.accessToken, externalId);

    if (!tracking?.courier?.location) {
      return null;
    }

    return {
      location: {
        lat: tracking.courier.location.latitude,
        lng: tracking.courier.location.longitude,
        heading: tracking.courier.location.bearing,
        timestamp: new Date(),
      },
      etaMinutes: tracking.courier.eta_minutes,
    };
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
      const parsed = UberEatsWebhookPayloadSchema.parse(payload.data);
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
    return ubereatsStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Normalize Uber Eats order to UnifiedDelivery format
   */
  private normalizeOrder(order: UberEatsOrder): UnifiedDelivery {
    const status = this.mapStatus(order.status);
    const now = new Date();

    // Parse ETA
    const etaMinutes = order.delivery_eta?.estimated_minutes ?? 30;
    const estimatedArrival = order.delivery_eta?.estimated_arrival
      ? new Date(order.delivery_eta.estimated_arrival)
      : new Date(Date.now() + etaMinutes * 60 * 1000);

    const minutesRemaining = Math.max(
      0,
      Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
    );

    // Build driver location
    let driverLocation: DriverLocation | undefined;
    if (order.courier?.location) {
      driverLocation = {
        lat: order.courier.location.latitude,
        lng: order.courier.location.longitude,
        heading: order.courier.location.bearing,
        speed: order.courier.location.speed,
        timestamp: now,
      };
    }

    // Build order items
    const items: OrderItem[] | undefined = order.items?.map((item) => ({
      name: item.title,
      quantity: item.quantity,
      unitPrice: item.price?.amount,
    }));

    // Format address
    const deliveryAddress = order.delivery_address;
    const formattedAddress =
      deliveryAddress?.formatted_address ??
      [
        deliveryAddress?.street_address,
        deliveryAddress?.street_address_2,
        `${deliveryAddress?.city}, ${deliveryAddress?.state} ${deliveryAddress?.postal_code}`,
      ]
        .filter(Boolean)
        .join(', ');

    return {
      id: this.generateDeliveryId(order.id),
      platform: 'ubereats',
      externalOrderId: order.id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(order.updated_at) ?? now,

      driver: order.courier
        ? {
            name: order.courier.name,
            photo: order.courier.picture_url,
            phone: order.courier.phone_number
              ? maskPhoneNumber(order.courier.phone_number)
              : undefined,
            rating: order.courier.rating,
            vehicle: order.courier.vehicle
              ? {
                  make: order.courier.vehicle.make,
                  model: order.courier.vehicle.model,
                  licensePlate: order.courier.vehicle.license_plate
                    ? maskLicensePlate(order.courier.vehicle.license_plate)
                    : undefined,
                }
              : undefined,
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
        confidence: order.courier?.location ? 'high' : 'medium',
      },

      order: {
        itemCount: order.items?.length ?? 0,
        totalAmount: order.total?.amount,
        currency: order.total?.currency ?? 'USD',
        items,
      },

      tracking: {
        url: order.tracking_url,
        mapAvailable: !!order.courier?.location,
        liveUpdates: status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: !!order.courier?.phone_number,
      },

      timestamps: {
        ordered: parseDate(order.created_at) ?? now,
        confirmed: status !== 'preparing' ? (parseDate(order.updated_at) ?? undefined) : undefined,
        driverAssigned: order.courier ? (parseDate(order.updated_at) ?? undefined) : undefined,
        delivered: parseDate(order.delivered_at) ?? undefined,
        cancelled: parseDate(order.cancelled_at) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'ubereats',
        rawData: order,
      },
    };
  }

  /**
   * Normalize webhook data to UnifiedDelivery
   */
  private normalizeWebhookData(webhook: UberEatsWebhookPayload): UnifiedDelivery | null {
    const { data } = webhook;
    const status = data.status ? this.mapStatus(data.status) : 'preparing';
    const now = new Date();

    // Parse ETA
    const etaMinutes = data.delivery_eta?.estimated_minutes ?? 30;
    const estimatedArrival = data.delivery_eta?.estimated_arrival
      ? new Date(data.delivery_eta.estimated_arrival)
      : new Date(Date.now() + etaMinutes * 60 * 1000);

    const minutesRemaining = Math.max(
      0,
      Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
    );

    // Build driver location from webhook
    let driverLocation: DriverLocation | undefined;
    if (data.courier?.location) {
      driverLocation = {
        lat: data.courier.location.latitude,
        lng: data.courier.location.longitude,
        heading: data.courier.location.bearing,
        timestamp: now,
      };
    }

    // Return partial delivery - webhook handler will merge with cached data
    return {
      id: this.generateDeliveryId(data.order_id),
      platform: 'ubereats',
      externalOrderId: data.order_id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(webhook.event_time) ?? now,

      driver: data.courier
        ? {
            name: data.courier.name,
            photo: data.courier.picture_url,
            phone: data.courier.phone_number
              ? maskPhoneNumber(data.courier.phone_number)
              : undefined,
            rating: data.courier.rating,
            vehicle: data.courier.vehicle
              ? {
                  make: data.courier.vehicle.make,
                  model: data.courier.vehicle.model,
                  licensePlate: data.courier.vehicle.license_plate
                    ? maskLicensePlate(data.courier.vehicle.license_plate)
                    : undefined,
                }
              : undefined,
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: '',
        lat: 0,
        lng: 0,
      },

      eta: {
        estimatedArrival,
        minutesRemaining,
        confidence: driverLocation ? 'high' : 'medium',
      },

      order: {
        itemCount: 0,
      },

      tracking: {
        mapAvailable: !!driverLocation,
        liveUpdates: true,
        contactDriverAvailable: !!data.courier?.phone_number,
      },

      timestamps: {
        ordered: now,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'webhook',
        adapterId: 'ubereats',
        rawData: webhook,
      },
    };
  }
}

/**
 * Export singleton instance
 */
export const ubereatsAdapter = new UberEatsAdapter();
