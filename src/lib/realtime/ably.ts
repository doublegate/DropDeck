import Ably from 'ably';

/**
 * Ably client configuration for DropDeck
 * Handles real-time WebSocket communication
 */

/**
 * Get Ably configuration
 */
function getAblyConfig(): { apiKey: string } | null {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    return null;
  }

  return { apiKey };
}

/**
 * Server-side Ably client (for publishing)
 * Uses API key authentication
 */
let serverAblyClient: Ably.Rest | null = null;

export function getServerAbly(): Ably.Rest | null {
  if (serverAblyClient) {
    return serverAblyClient;
  }

  const config = getAblyConfig();
  if (!config) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Ably not configured - real-time features will be disabled');
    }
    return null;
  }

  serverAblyClient = new Ably.Rest(config.apiKey);
  return serverAblyClient;
}

/**
 * Generate an Ably token for client-side authentication
 * Tokens are scoped to specific capabilities per user
 */
export async function generateAblyToken(
  userId: string,
  capabilities: AblyCapabilities = {}
): Promise<Ably.TokenRequest | null> {
  const ably = getServerAbly();
  if (!ably) {
    return null;
  }

  // Default capabilities for the user - using Ably's capabilityOp types
  const defaultCapabilities: Record<string, Ably.capabilityOp[]> = {
    [`user:${userId}:*`]: ['subscribe', 'presence'],
    'delivery:*:location': ['subscribe'],
    'system:*': ['subscribe'],
  };

  // Merge with custom capabilities (cast to proper type)
  const mergedCapabilities: Record<string, Ably.capabilityOp[]> = {
    ...defaultCapabilities,
    ...Object.fromEntries(
      Object.entries(capabilities).map(([k, v]) => [k, v as Ably.capabilityOp[]])
    ),
  };

  try {
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: userId,
      capability: mergedCapabilities,
      ttl: 3600 * 1000, // 1 hour
    });

    return tokenRequest;
  } catch (error) {
    console.error('Failed to generate Ably token:', error);
    return null;
  }
}

/**
 * Ably channel capabilities
 */
export interface AblyCapabilities {
  [channel: string]: string[];
}

/**
 * Channel names for Ably
 */
export const ablyChannels = {
  /** User's delivery updates */
  userDeliveries: (userId: string) => `user:${userId}:deliveries`,

  /** User's connection status updates */
  userConnections: (userId: string) => `user:${userId}:connections`,

  /** User's notification updates */
  userNotifications: (userId: string) => `user:${userId}:notifications`,

  /** Delivery location updates (high frequency) */
  deliveryLocation: (deliveryId: string) => `delivery:${deliveryId}:location`,

  /** System-wide announcements */
  systemStatus: 'system:status',

  /** User presence (for multi-device sync) */
  userPresence: (userId: string) => `user:${userId}:presence`,
} as const;

/**
 * Publish a message to an Ably channel
 */
export async function publishToChannel(
  channel: string,
  eventName: string,
  data: unknown
): Promise<boolean> {
  const ably = getServerAbly();
  if (!ably) {
    return false;
  }

  try {
    const ch = ably.channels.get(channel);
    await ch.publish(eventName, data);
    return true;
  } catch (error) {
    console.error(`Failed to publish to channel ${channel}:`, error);
    return false;
  }
}

/**
 * Publish a delivery update
 */
export async function publishDeliveryUpdate(userId: string, delivery: unknown): Promise<boolean> {
  return publishToChannel(ablyChannels.userDeliveries(userId), 'delivery_update', delivery);
}

/**
 * Publish a location update
 */
export async function publishLocationUpdate(
  deliveryId: string,
  location: unknown
): Promise<boolean> {
  return publishToChannel(ablyChannels.deliveryLocation(deliveryId), 'location_update', location);
}

/**
 * Publish a connection status change
 */
export async function publishConnectionStatus(
  userId: string,
  status: { platform: string; status: string; message?: string }
): Promise<boolean> {
  return publishToChannel(ablyChannels.userConnections(userId), 'connection_status', status);
}

/**
 * Publish a notification to user
 */
export async function publishNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    timestamp: string;
  }
): Promise<boolean> {
  return publishToChannel(ablyChannels.userNotifications(userId), 'notification', notification);
}

/**
 * Check if Ably is available
 */
export function isAblyAvailable(): boolean {
  return getAblyConfig() !== null;
}
