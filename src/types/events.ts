/**
 * Real-time event types for DropDeck
 */

import type { DeliveryStatus, UnifiedDelivery } from './delivery';
import type { Platform } from './platform';

/**
 * Base event structure
 */
export interface BaseEvent {
  /** Event type identifier */
  type: string;
  /** ISO timestamp of when the event occurred */
  timestamp: string;
}

/**
 * Delivery update event
 */
export interface DeliveryUpdateEvent extends BaseEvent {
  type: 'delivery_update';
  payload: {
    deliveryId: string;
    platform: Platform;
    status: DeliveryStatus;
    statusLabel: string;
    eta?: number;
    previousStatus?: DeliveryStatus;
    isComplete?: boolean;
    delivery?: UnifiedDelivery;
  };
}

/**
 * Location update event (high frequency)
 */
export interface LocationUpdateEvent extends BaseEvent {
  type: 'location_update';
  payload: {
    deliveryId: string;
    platform: Platform;
    location: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      timestamp: string;
    };
  };
}

/**
 * Connection status event
 */
export interface ConnectionStatusEvent extends BaseEvent {
  type: 'connection_status';
  payload: {
    platform: Platform;
    status: 'connected' | 'disconnected' | 'error' | 'expired';
    message?: string;
    expiresAt?: string;
  };
}

/**
 * System status event
 */
export interface SystemStatusEvent extends BaseEvent {
  type: 'system_status';
  payload: {
    type: 'maintenance' | 'outage' | 'info' | 'recovery';
    message: string;
    affectedPlatforms?: Platform[];
    startTime?: string;
    estimatedEndTime?: string;
  };
}

/**
 * All possible real-time events
 */
export type RealtimeEvent =
  | DeliveryUpdateEvent
  | LocationUpdateEvent
  | ConnectionStatusEvent
  | SystemStatusEvent;

/**
 * Event handler type
 */
export type EventHandler<T extends RealtimeEvent = RealtimeEvent> = (event: T) => void;

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
  /** Reconnection delay in milliseconds */
  reconnectDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
}
