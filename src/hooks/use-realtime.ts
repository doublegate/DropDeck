'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Ably from 'ably';
import type { RealtimeEvent, DeliveryUpdateEvent, LocationUpdateEvent, ConnectionStatusEvent } from '@/lib/realtime/events';

/**
 * Connection state for real-time
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed';

/**
 * Hook options
 */
interface UseRealTimeOptions {
  /** User ID for authentication */
  userId?: string;
  /** Callback when delivery updates are received */
  onDeliveryUpdate?: (event: DeliveryUpdateEvent) => void;
  /** Callback when location updates are received */
  onLocationUpdate?: (event: LocationUpdateEvent) => void;
  /** Callback when connection status changes */
  onConnectionStatus?: (event: ConnectionStatusEvent) => void;
  /** Callback when connection state changes */
  onStateChange?: (state: ConnectionState) => void;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Real-time updates hook
 * Manages Ably connection and event subscriptions
 */
export function useRealTimeUpdates(options: UseRealTimeOptions = {}) {
  const { userId, onDeliveryUpdate, onLocationUpdate, onConnectionStatus, onStateChange, debug } =
    options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isOnline, setIsOnline] = useState(true);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelsRef = useRef<Map<string, Ably.RealtimeChannel>>(new Map());

  /**
   * Log debug messages
   */
  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('[useRealTimeUpdates]', ...args);
      }
    },
    [debug]
  );

  /**
   * Update connection state and notify
   */
  const updateState = useCallback(
    (state: ConnectionState) => {
      setConnectionState(state);
      onStateChange?.(state);
      log('State changed:', state);
    },
    [onStateChange, log]
  );

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback(
    (message: Ably.Message) => {
      try {
        const event = message.data as RealtimeEvent;

        switch (event.type) {
          case 'delivery_update':
            log('Delivery update:', event);
            onDeliveryUpdate?.(event);
            break;
          case 'location_update':
            log('Location update:', event);
            onLocationUpdate?.(event);
            break;
          case 'connection_status':
            log('Connection status:', event);
            onConnectionStatus?.(event);
            break;
          default:
            log('Unknown event type:', event);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    },
    [onDeliveryUpdate, onLocationUpdate, onConnectionStatus, log]
  );

  /**
   * Subscribe to a channel
   */
  const subscribe = useCallback(
    async (channelName: string) => {
      if (!clientRef.current) return;

      if (channelsRef.current.has(channelName)) {
        log('Already subscribed to:', channelName);
        return;
      }

      const channel = clientRef.current.channels.get(channelName);

      channel.subscribe((message) => {
        handleMessage(message);
      });

      channelsRef.current.set(channelName, channel);
      log('Subscribed to:', channelName);
    },
    [handleMessage, log]
  );

  /**
   * Unsubscribe from a channel
   */
  const unsubscribe = useCallback(
    (channelName: string) => {
      const channel = channelsRef.current.get(channelName);
      if (channel) {
        channel.unsubscribe();
        channelsRef.current.delete(channelName);
        log('Unsubscribed from:', channelName);
      }
    },
    [log]
  );

  /**
   * Initialize Ably client
   */
  useEffect(() => {
    if (!userId) {
      log('No userId, skipping initialization');
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
    if (!apiKey) {
      log('No Ably API key, skipping initialization');
      return;
    }

    log('Initializing Ably client');
    updateState('connecting');

    const client = new Ably.Realtime({
      key: apiKey,
      clientId: userId,
      autoConnect: true,
      recover: (_, callback) => {
        // Attempt to recover the connection
        callback(true);
      },
    });

    client.connection.on('connected', () => {
      updateState('connected');
    });

    client.connection.on('disconnected', () => {
      updateState('disconnected');
    });

    client.connection.on('failed', () => {
      updateState('failed');
    });

    client.connection.on('connecting', () => {
      updateState('connecting');
    });

    clientRef.current = client;

    // Subscribe to user channels
    const userDeliveriesChannel = `user:${userId}:deliveries`;
    const userConnectionsChannel = `user:${userId}:connections`;

    subscribe(userDeliveriesChannel);
    subscribe(userConnectionsChannel);

    return () => {
      log('Cleaning up Ably client');
      channelsRef.current.forEach((channel, name) => {
        channel.unsubscribe();
        log('Unsubscribed from:', name);
      });
      channelsRef.current.clear();
      client.close();
      clientRef.current = null;
    };
  }, [userId, subscribe, updateState, log]);

  /**
   * Handle online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      log('Browser online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      log('Browser offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [log]);

  return {
    connectionState,
    isOnline,
    isConnected: connectionState === 'connected',
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for subscribing to delivery location updates
 */
export function useLocationSubscription(
  deliveryId: string | null,
  onUpdate: (location: LocationUpdateEvent['payload']['location']) => void
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  useEffect(() => {
    if (!deliveryId) {
      setIsSubscribed(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
    if (!apiKey) return;

    const client = new Ably.Realtime({
      key: apiKey,
      autoConnect: true,
    });

    const channelName = `delivery:${deliveryId}:location`;
    const channel = client.channels.get(channelName);

    channel.subscribe('location_update', (message) => {
      const event = message.data as LocationUpdateEvent;
      onUpdate(event.payload.location);
    });

    clientRef.current = client;
    channelRef.current = channel;
    setIsSubscribed(true);

    return () => {
      channel.unsubscribe();
      client.close();
      clientRef.current = null;
      channelRef.current = null;
      setIsSubscribed(false);
    };
  }, [deliveryId, onUpdate]);

  return { isSubscribed };
}
