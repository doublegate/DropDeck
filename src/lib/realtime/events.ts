import { z } from 'zod';
import type { DeliveryStatus, DriverLocation } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * Event schemas and types for real-time updates
 */

/**
 * Delivery update event schema
 */
export const deliveryUpdateSchema = z.object({
  type: z.literal('delivery_update'),
  timestamp: z.string().datetime(),
  payload: z.object({
    deliveryId: z.string(),
    platform: z.string(),
    status: z.string(),
    statusLabel: z.string(),
    eta: z.number().optional(),
    previousStatus: z.string().optional(),
    isComplete: z.boolean().optional(),
  }),
});

export type DeliveryUpdateEvent = z.infer<typeof deliveryUpdateSchema>;

/**
 * Location update event schema
 */
export const locationUpdateSchema = z.object({
  type: z.literal('location_update'),
  timestamp: z.string().datetime(),
  payload: z.object({
    deliveryId: z.string(),
    platform: z.string(),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      heading: z.number().optional(),
      speed: z.number().optional(),
      accuracy: z.number().optional(),
      timestamp: z.string().datetime(),
    }),
  }),
});

export type LocationUpdateEvent = z.infer<typeof locationUpdateSchema>;

/**
 * Connection status event schema
 */
export const connectionStatusSchema = z.object({
  type: z.literal('connection_status'),
  timestamp: z.string().datetime(),
  payload: z.object({
    platform: z.string(),
    status: z.enum(['connected', 'disconnected', 'error', 'expired']),
    message: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

export type ConnectionStatusEvent = z.infer<typeof connectionStatusSchema>;

/**
 * System status event schema
 */
export const systemStatusSchema = z.object({
  type: z.literal('system_status'),
  timestamp: z.string().datetime(),
  payload: z.object({
    type: z.enum(['maintenance', 'outage', 'info', 'recovery']),
    message: z.string(),
    affectedPlatforms: z.array(z.string()).optional(),
    startTime: z.string().datetime().optional(),
    estimatedEndTime: z.string().datetime().optional(),
  }),
});

export type SystemStatusEvent = z.infer<typeof systemStatusSchema>;

/**
 * Notification event schema
 */
export const notificationEventSchema = z.object({
  type: z.literal('notification'),
  timestamp: z.string().datetime(),
  payload: z.object({
    id: z.string().optional(),
    notificationType: z.enum([
      'delivery_status_change',
      'driver_assigned',
      'out_for_delivery',
      'arriving_soon',
      'delivered',
      'delay_detected',
      'platform_connected',
      'platform_disconnected',
    ]),
    title: z.string(),
    body: z.string(),
    data: z
      .object({
        deliveryId: z.string().optional(),
        platform: z.string().optional(),
        status: z.string().optional(),
        actionUrl: z.string().optional(),
      })
      .optional(),
  }),
});

export type NotificationEvent = z.infer<typeof notificationEventSchema>;

/**
 * Union of all event types
 */
export type RealtimeEvent =
  | DeliveryUpdateEvent
  | LocationUpdateEvent
  | ConnectionStatusEvent
  | SystemStatusEvent
  | NotificationEvent;

/**
 * Event type guard
 */
export function isDeliveryUpdateEvent(event: RealtimeEvent): event is DeliveryUpdateEvent {
  return event.type === 'delivery_update';
}

export function isLocationUpdateEvent(event: RealtimeEvent): event is LocationUpdateEvent {
  return event.type === 'location_update';
}

export function isConnectionStatusEvent(event: RealtimeEvent): event is ConnectionStatusEvent {
  return event.type === 'connection_status';
}

export function isSystemStatusEvent(event: RealtimeEvent): event is SystemStatusEvent {
  return event.type === 'system_status';
}

export function isNotificationEvent(event: RealtimeEvent): event is NotificationEvent {
  return event.type === 'notification';
}

/**
 * Validate an event against its schema
 */
export function validateEvent(
  event: unknown
): { success: true; event: RealtimeEvent } | { success: false; error: string } {
  // Try each schema
  const schemas = [
    deliveryUpdateSchema,
    locationUpdateSchema,
    connectionStatusSchema,
    systemStatusSchema,
    notificationEventSchema,
  ];

  for (const schema of schemas) {
    const result = schema.safeParse(event);
    if (result.success) {
      return { success: true, event: result.data as RealtimeEvent };
    }
  }

  return { success: false, error: 'Invalid event structure' };
}

/**
 * Create a delivery update event
 */
export function createDeliveryUpdateEvent(
  deliveryId: string,
  platform: Platform,
  status: DeliveryStatus,
  statusLabel: string,
  options?: {
    eta?: number;
    previousStatus?: DeliveryStatus;
    isComplete?: boolean;
  }
): DeliveryUpdateEvent {
  return {
    type: 'delivery_update',
    timestamp: new Date().toISOString(),
    payload: {
      deliveryId,
      platform,
      status,
      statusLabel,
      ...options,
    },
  };
}

/**
 * Create a location update event
 */
export function createLocationUpdateEvent(
  deliveryId: string,
  platform: Platform,
  location: DriverLocation
): LocationUpdateEvent {
  return {
    type: 'location_update',
    timestamp: new Date().toISOString(),
    payload: {
      deliveryId,
      platform,
      location: {
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        timestamp: location.timestamp.toISOString(),
      },
    },
  };
}

/**
 * Create a connection status event
 */
export function createConnectionStatusEvent(
  platform: Platform,
  status: 'connected' | 'disconnected' | 'error' | 'expired',
  options?: {
    message?: string;
    expiresAt?: Date;
  }
): ConnectionStatusEvent {
  return {
    type: 'connection_status',
    timestamp: new Date().toISOString(),
    payload: {
      platform,
      status,
      message: options?.message,
      expiresAt: options?.expiresAt?.toISOString(),
    },
  };
}

/**
 * Create a system status event
 */
export function createSystemStatusEvent(
  type: 'maintenance' | 'outage' | 'info' | 'recovery',
  message: string,
  options?: {
    affectedPlatforms?: Platform[];
    startTime?: Date;
    estimatedEndTime?: Date;
  }
): SystemStatusEvent {
  return {
    type: 'system_status',
    timestamp: new Date().toISOString(),
    payload: {
      type,
      message,
      affectedPlatforms: options?.affectedPlatforms,
      startTime: options?.startTime?.toISOString(),
      estimatedEndTime: options?.estimatedEndTime?.toISOString(),
    },
  };
}
