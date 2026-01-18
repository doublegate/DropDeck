'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Ably from 'ably';

/**
 * Notification item for display
 */
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    deliveryId?: string;
    platform?: string;
    status?: string;
    actionUrl?: string;
  };
  read: boolean;
  createdAt: Date;
}

/**
 * Hook options for notifications
 */
interface UseNotificationsOptions {
  /** User ID for subscription */
  userId?: string;
  /** Callback when a new notification is received */
  onNotification?: (notification: NotificationItem) => void;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook for real-time notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { userId, onNotification, debug } = options;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  /**
   * Log debug messages
   */
  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('[useNotifications]', ...args);
      }
    },
    [debug]
  );

  /**
   * Add a notification to state
   */
  const addNotification = useCallback(
    (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep max 50
      setUnreadCount((prev) => prev + 1);
      onNotification?.(notification);
      log('New notification:', notification);
    },
    [onNotification, log]
  );

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      log('Marked as read:', notificationId);
    },
    [log]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    log('Marked all as read');
  }, [log]);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    log('Cleared all notifications');
  }, [log]);

  /**
   * Initialize Ably subscription
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

    log('Initializing notification subscription');

    const client = new Ably.Realtime({
      key: apiKey,
      clientId: userId,
      autoConnect: true,
    });

    const channelName = `user:${userId}:notifications`;
    const channel = client.channels.get(channelName);

    client.connection.on('connected', () => {
      setIsConnected(true);
      log('Connected');
    });

    client.connection.on('disconnected', () => {
      setIsConnected(false);
      log('Disconnected');
    });

    channel.subscribe('notification', (message) => {
      try {
        const event = message.data as {
          type: string;
          title: string;
          body: string;
          data?: NotificationItem['data'];
          timestamp: string;
        };

        const notification: NotificationItem = {
          id: message.id ?? crypto.randomUUID(),
          type: event.type,
          title: event.title,
          body: event.body,
          data: event.data,
          read: false,
          createdAt: new Date(event.timestamp),
        };

        addNotification(notification);
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    });

    clientRef.current = client;
    channelRef.current = channel;

    return () => {
      log('Cleaning up notification subscription');
      channel.unsubscribe();
      client.close();
      clientRef.current = null;
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [userId, addNotification, log]);

  /**
   * Load initial notifications from API
   */
  const loadNotifications = useCallback(
    async (_limit = 20) => {
      if (!userId) return;

      try {
        // This would be a tRPC call in production
        // For now, we'll just use the local state
        log('Would load notifications from API');
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    },
    [userId, log]
  );

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll,
    loadNotifications,
    addNotification,
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences(_userId?: string) {
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    inAppEnabled: true,
    soundEnabled: true,
    driverAssigned: true,
    outForDelivery: true,
    arrivingSoon: true,
    delivered: true,
    delayed: true,
    platformStatus: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });
  const [isLoading, _setIsLoading] = useState(false);

  /**
   * Update a preference
   */
  const updatePreference = useCallback(
    async <K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));

      // In production, this would sync to the server
      // await trpc.notification.updatePreferences.mutate({ [key]: value });
    },
    []
  );

  return {
    preferences,
    isLoading,
    updatePreference,
  };
}
