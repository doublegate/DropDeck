import { redis, channels as redisChannels } from './redis';
import { publishToChannel, ablyChannels } from './ably';
import type { UnifiedDelivery, DriverLocation } from '@/types/delivery';

/**
 * Pub/Sub system for DropDeck
 * Bridges Redis pub/sub with Ably for real-time updates
 */

/**
 * Message types for pub/sub
 */
export type MessageType =
  | 'delivery_update'
  | 'location_update'
  | 'connection_status'
  | 'system_status';

/**
 * Base message structure
 */
export interface PubSubMessage<T = unknown> {
  type: MessageType;
  timestamp: string;
  payload: T;
}

/**
 * Delivery update payload
 */
export interface DeliveryUpdatePayload {
  deliveryId: string;
  platform: string;
  status: string;
  eta?: number;
  statusLabel: string;
  delivery?: UnifiedDelivery;
}

/**
 * Location update payload
 */
export interface LocationUpdatePayload {
  deliveryId: string;
  platform: string;
  location: DriverLocation;
}

/**
 * Connection status payload
 */
export interface ConnectionStatusPayload {
  platform: string;
  status: 'connected' | 'disconnected' | 'error' | 'expired';
  message?: string;
}

/**
 * System status payload
 */
export interface SystemStatusPayload {
  type: 'maintenance' | 'outage' | 'info';
  message: string;
  affectedPlatforms?: string[];
}

/**
 * Create a message with timestamp
 */
function createMessage<T>(type: MessageType, payload: T): PubSubMessage<T> {
  return {
    type,
    timestamp: new Date().toISOString(),
    payload,
  };
}

/**
 * Publish to Redis and optionally relay to Ably
 */
async function publish<T>(
  redisChannel: string,
  ablyChannel: string | null,
  type: MessageType,
  payload: T
): Promise<boolean> {
  const message = createMessage(type, payload);
  const messageStr = JSON.stringify(message);

  let redisSuccess = false;
  let ablySuccess = false;

  // Publish to Redis
  if (redis) {
    try {
      await redis.publish(redisChannel, messageStr);
      redisSuccess = true;
    } catch (error) {
      console.error(`Failed to publish to Redis channel ${redisChannel}:`, error);
    }
  }

  // Relay to Ably
  if (ablyChannel) {
    ablySuccess = await publishToChannel(ablyChannel, type, payload);
  }

  return redisSuccess || ablySuccess;
}

/**
 * Publish a delivery update for a user
 */
export async function publishDeliveryUpdate(
  userId: string,
  payload: DeliveryUpdatePayload
): Promise<boolean> {
  return publish(
    redisChannels.userDeliveries(userId),
    ablyChannels.userDeliveries(userId),
    'delivery_update',
    payload
  );
}

/**
 * Publish a location update for a delivery
 */
export async function publishLocationUpdate(
  userId: string,
  deliveryId: string,
  payload: LocationUpdatePayload
): Promise<boolean> {
  // Publish to both user channel and delivery-specific channel
  const [userSuccess, deliverySuccess] = await Promise.all([
    publish(
      redisChannels.userDeliveries(userId),
      ablyChannels.userDeliveries(userId),
      'location_update',
      payload
    ),
    publish(
      redisChannels.deliveryLocation(deliveryId),
      ablyChannels.deliveryLocation(deliveryId),
      'location_update',
      payload
    ),
  ]);

  return userSuccess || deliverySuccess;
}

/**
 * Publish a connection status change
 */
export async function publishConnectionStatus(
  userId: string,
  payload: ConnectionStatusPayload
): Promise<boolean> {
  return publish(
    redisChannels.userConnections(userId),
    ablyChannels.userConnections(userId),
    'connection_status',
    payload
  );
}

/**
 * Publish a system-wide status message
 */
export async function publishSystemStatus(payload: SystemStatusPayload): Promise<boolean> {
  return publish(redisChannels.systemStatus, ablyChannels.systemStatus, 'system_status', payload);
}

/**
 * Subscribe to a Redis channel (server-side only)
 * Note: This is a basic implementation. In production, you would use
 * a dedicated subscriber connection.
 */
export async function subscribeToChannel(
  channel: string,
  _handler: (message: PubSubMessage) => void
): Promise<() => void> {
  // This is a placeholder for Redis subscription
  // In production, you would use ioredis or a similar library
  // that supports proper pub/sub with separate connections
  console.log(`Subscribing to channel: ${channel}`);

  // Return unsubscribe function
  return () => {
    console.log(`Unsubscribing from channel: ${channel}`);
  };
}

/**
 * Batch publish multiple messages
 */
export async function batchPublish(
  messages: Array<{
    userId: string;
    type: MessageType;
    payload: unknown;
  }>
): Promise<number> {
  const results = await Promise.allSettled(
    messages.map((msg) => {
      switch (msg.type) {
        case 'delivery_update':
          return publishDeliveryUpdate(msg.userId, msg.payload as DeliveryUpdatePayload);
        case 'location_update':
          return publishLocationUpdate(
            msg.userId,
            (msg.payload as LocationUpdatePayload).deliveryId,
            msg.payload as LocationUpdatePayload
          );
        case 'connection_status':
          return publishConnectionStatus(msg.userId, msg.payload as ConnectionStatusPayload);
        default:
          return Promise.resolve(false);
      }
    })
  );

  return results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
}
