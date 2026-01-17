import crypto from 'node:crypto';
import { PlatformAdapter } from '../base';
import type { AdapterConnection, AdapterMetadata, WebhookPayload } from '../types';
import type { DeliveryStatus, UnifiedDelivery, DriverLocation, OrderItem } from '@/types/delivery';
import { getDoorDashClient, type DoorDashApiClient } from './client';
import { doordashStatusMap } from '../status-map';
import { maskPhoneNumber, maskLicensePlate, parseDate } from '../utils';
import {
  DoorDashWebhookPayloadSchema,
  type DoorDashDelivery,
  type DoorDashWebhookPayload,
} from './types';

/**
 * DoorDash Platform Adapter
 *
 * Implements JWT-based authentication and Drive API for delivery tracking.
 * Supports real-time location tracking via webhooks.
 */
export class DoorDashAdapter extends PlatformAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'doordash',
    displayName: 'DoorDash',
    iconUrl: '/icons/doordash.svg',
    primaryColor: '#FF3008',
    capabilities: {
      oauth: false, // DoorDash uses JWT, not OAuth
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
    apiBaseUrl: 'https://openapi.doordash.com/drive/v2',
  };

  private client: DoorDashApiClient;
  private webhookSecret: string;

  constructor() {
    super();
    this.client = getDoorDashClient();
    this.webhookSecret = process.env.DOORDASH_WEBHOOK_SECRET ?? '';
  }

  // ============================================
  // OAuth Methods (DoorDash uses JWT, not OAuth)
  // ============================================

  override supportsOAuth(): boolean {
    return false;
  }

  // DoorDash uses server-to-server JWT auth, no user OAuth flow needed
  // The API keys are configured at the application level

  override async testConnection(_accessToken: string): Promise<void> {
    // Test by fetching deliveries list
    await this.client.getActiveDeliveries();
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(_connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    const response = await this.client.getActiveDeliveries();
    return response.deliveries.map((delivery) => this.normalizeDelivery(delivery));
  }

  async getDeliveryDetails(
    _connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    // Extract external delivery ID from our internal ID format
    const externalId = deliveryId.startsWith('do_') ? deliveryId.slice(3) : deliveryId;
    const delivery = await this.client.getDelivery(externalId);
    return this.normalizeDelivery(delivery);
  }

  /**
   * Get dasher location for a specific delivery
   */
  async getDasherLocation(deliveryId: string): Promise<DriverLocation | null> {
    try {
      const externalId = deliveryId.startsWith('do_') ? deliveryId.slice(3) : deliveryId;
      const delivery = await this.client.getDelivery(externalId);

      if (delivery.dasher?.location) {
        return {
          lat: delivery.dasher.location.lat,
          lng: delivery.dasher.location.lng,
          heading: delivery.dasher.location.heading,
          speed: delivery.dasher.location.speed_mph
            ? delivery.dasher.location.speed_mph * 1.60934 // Convert mph to km/h
            : undefined,
          timestamp: delivery.dasher.location.timestamp
            ? new Date(delivery.dasher.location.timestamp)
            : new Date(),
        };
      }
      return null;
    } catch {
      return null;
    }
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

      // DoorDash may send signature with 'sha256=' prefix
      const normalizedSignature = signature.replace(/^sha256=/, '');

      return crypto.timingSafeEqual(
        Buffer.from(normalizedSignature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  override normalizeWebhookPayload(payload: WebhookPayload): UnifiedDelivery | null {
    try {
      const parsed = DoorDashWebhookPayloadSchema.parse(payload.data);
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
    return doordashStatusMap[normalized] ?? 'preparing';
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Normalize DoorDash delivery to UnifiedDelivery format
   */
  private normalizeDelivery(delivery: DoorDashDelivery): UnifiedDelivery {
    const status = this.mapStatus(delivery.delivery_status);
    const now = new Date();

    // Parse estimated delivery time
    const estimatedArrival = delivery.estimated_delivery_time
      ? new Date(delivery.estimated_delivery_time)
      : new Date(Date.now() + 30 * 60 * 1000); // Default 30 minutes

    const minutesRemaining = Math.max(
      0,
      Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
    );

    // Build driver location
    let driverLocation: DriverLocation | undefined;
    if (delivery.dasher?.location) {
      driverLocation = {
        lat: delivery.dasher.location.lat,
        lng: delivery.dasher.location.lng,
        heading: delivery.dasher.location.heading,
        speed: delivery.dasher.location.speed_mph
          ? delivery.dasher.location.speed_mph * 1.60934 // Convert to km/h
          : undefined,
        timestamp: delivery.dasher.location.timestamp
          ? new Date(delivery.dasher.location.timestamp)
          : now,
      };
    }

    // Build order items
    const items: OrderItem[] | undefined = delivery.items?.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    // Calculate distance if we have both locations
    let distanceRemaining: { value: number; unit: 'miles' } | undefined;
    if (driverLocation && delivery.dropoff_address.latitude && delivery.dropoff_address.longitude) {
      const R = 3959; // Earth radius in miles
      const dLat = this.toRadians(delivery.dropoff_address.latitude - driverLocation.lat);
      const dLng = this.toRadians(delivery.dropoff_address.longitude - driverLocation.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(driverLocation.lat)) *
          Math.cos(this.toRadians(delivery.dropoff_address.latitude)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      distanceRemaining = {
        value: Math.round(distance * 10) / 10,
        unit: 'miles',
      };
    }

    return {
      id: this.generateDeliveryId(delivery.external_delivery_id),
      platform: 'doordash',
      externalOrderId: delivery.external_delivery_id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(delivery.updated_at) ?? now,

      driver: delivery.dasher
        ? {
            name: delivery.dasher.first_name,
            photo: delivery.dasher.profile_image_url,
            phone: delivery.dasher.phone_number
              ? maskPhoneNumber(delivery.dasher.phone_number)
              : undefined,
            rating: delivery.dasher.rating,
            vehicle: delivery.dasher.vehicle
              ? {
                  make: delivery.dasher.vehicle.make,
                  model: delivery.dasher.vehicle.model,
                  color: delivery.dasher.vehicle.color,
                  licensePlate: delivery.dasher.vehicle.license_plate_last_four
                    ? maskLicensePlate(delivery.dasher.vehicle.license_plate_last_four)
                    : undefined,
                }
              : undefined,
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: this.formatAddress(delivery.dropoff_address),
        addressLine1: delivery.dropoff_address.street,
        city: delivery.dropoff_address.city,
        state: delivery.dropoff_address.state,
        zipCode: delivery.dropoff_address.zip_code,
        lat: delivery.dropoff_address.latitude ?? 0,
        lng: delivery.dropoff_address.longitude ?? 0,
        instructions: delivery.dropoff_instructions,
      },

      eta: {
        estimatedArrival,
        minutesRemaining,
        distanceRemaining,
        confidence: delivery.dasher?.location ? 'high' : 'medium',
      },

      order: {
        itemCount: delivery.items?.length ?? 0,
        totalAmount: delivery.order_value,
        currency: delivery.currency,
        items,
      },

      tracking: {
        url: delivery.tracking_url,
        mapAvailable: !!delivery.dasher?.location,
        liveUpdates: status === 'out_for_delivery' || status === 'arriving',
        contactDriverAvailable: !!delivery.dasher?.phone_number,
      },

      timestamps: {
        ordered: parseDate(delivery.created_at) ?? now,
        confirmed:
          delivery.delivery_status !== 'created'
            ? (parseDate(delivery.updated_at) ?? undefined)
            : undefined,
        driverAssigned: delivery.dasher ? (parseDate(delivery.updated_at) ?? undefined) : undefined,
        pickedUp: parseDate(delivery.picked_up_at) ?? undefined,
        delivered: parseDate(delivery.delivered_at) ?? undefined,
        cancelled: parseDate(delivery.cancelled_at) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'doordash',
        rawData: delivery,
      },
    };
  }

  /**
   * Normalize webhook data to UnifiedDelivery
   */
  private normalizeWebhookData(webhook: DoorDashWebhookPayload): UnifiedDelivery | null {
    const status = this.mapStatus(webhook.delivery_status);
    const now = new Date();

    // Parse estimated delivery time
    const estimatedArrival = webhook.estimated_delivery_time
      ? new Date(webhook.estimated_delivery_time)
      : new Date(Date.now() + 30 * 60 * 1000);

    const minutesRemaining = Math.max(
      0,
      Math.round((estimatedArrival.getTime() - now.getTime()) / 60000)
    );

    // Build driver location from webhook
    let driverLocation: DriverLocation | undefined;
    if (webhook.dasher?.location) {
      driverLocation = {
        lat: webhook.dasher.location.lat,
        lng: webhook.dasher.location.lng,
        heading: webhook.dasher.location.heading,
        speed: webhook.dasher.location.speed_mph
          ? webhook.dasher.location.speed_mph * 1.60934
          : undefined,
        timestamp: webhook.dasher.location.timestamp
          ? new Date(webhook.dasher.location.timestamp)
          : now,
      };
    }

    // Return partial delivery - webhook handler will merge with cached data
    return {
      id: this.generateDeliveryId(webhook.external_delivery_id),
      platform: 'doordash',
      externalOrderId: webhook.external_delivery_id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: parseDate(webhook.timestamp) ?? now,

      driver: webhook.dasher
        ? {
            name: webhook.dasher.first_name,
            photo: webhook.dasher.profile_image_url,
            phone: webhook.dasher.phone_number
              ? maskPhoneNumber(webhook.dasher.phone_number)
              : undefined,
            rating: webhook.dasher.rating,
            vehicle: webhook.dasher.vehicle
              ? {
                  make: webhook.dasher.vehicle.make,
                  model: webhook.dasher.vehicle.model,
                  color: webhook.dasher.vehicle.color,
                  licensePlate: webhook.dasher.vehicle.license_plate_last_four
                    ? maskLicensePlate(webhook.dasher.vehicle.license_plate_last_four)
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
        contactDriverAvailable: !!webhook.dasher?.phone_number,
      },

      timestamps: {
        ordered: parseDate(webhook.created_at) ?? now,
        pickedUp: parseDate(webhook.pickup_time) ?? undefined,
        delivered: parseDate(webhook.dropoff_time) ?? undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'webhook',
        adapterId: 'doordash',
        rawData: webhook,
      },
    };
  }

  /**
   * Format address for display
   */
  private formatAddress(address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip_code: string;
  }): string {
    const parts = [
      address.street,
      address.unit,
      `${address.city}, ${address.state} ${address.zip_code}`,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Export singleton instance
 */
export const doordashAdapter = new DoorDashAdapter();
