/**
 * Real-Time Infrastructure - Main Export
 */

// Redis
export { redis, isRedisAvailable, channels, cacheKeys, ttl } from './redis';

// Ably
export {
  getServerAbly,
  generateAblyToken,
  publishToChannel,
  publishDeliveryUpdate as ablyPublishDeliveryUpdate,
  publishLocationUpdate as ablyPublishLocationUpdate,
  publishConnectionStatus as ablyPublishConnectionStatus,
  isAblyAvailable,
  ablyChannels,
} from './ably';
export type { AblyCapabilities } from './ably';

// Pub/Sub
export {
  publishDeliveryUpdate,
  publishLocationUpdate,
  publishConnectionStatus,
  publishSystemStatus,
  subscribeToChannel,
  batchPublish,
} from './pubsub';
export type {
  MessageType,
  PubSubMessage,
  DeliveryUpdatePayload,
  LocationUpdatePayload,
  ConnectionStatusPayload,
  SystemStatusPayload,
} from './pubsub';

// Events
export {
  deliveryUpdateSchema,
  locationUpdateSchema,
  connectionStatusSchema,
  systemStatusSchema,
  validateEvent,
  createDeliveryUpdateEvent,
  createLocationUpdateEvent,
  createConnectionStatusEvent,
} from './events';
export type {
  DeliveryUpdateEvent,
  LocationUpdateEvent,
  ConnectionStatusEvent,
  SystemStatusEvent,
  RealtimeEvent,
} from './events';
