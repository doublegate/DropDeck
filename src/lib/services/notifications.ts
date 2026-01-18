import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notificationPreferences, notifications, pushSubscriptions } from '@/lib/db/schema';
import { ablyChannels, publishToChannel } from '@/lib/realtime/ably';
import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * Notification types
 */
export type NotificationType =
  | 'delivery_status_change'
  | 'driver_assigned'
  | 'out_for_delivery'
  | 'arriving_soon'
  | 'delivered'
  | 'delay_detected'
  | 'platform_connected'
  | 'platform_disconnected';

/**
 * Notification data payload
 */
export interface NotificationData {
  deliveryId?: string;
  platform?: string;
  status?: string;
  actionUrl?: string;
}

/**
 * Notification content
 */
export interface NotificationContent {
  title: string;
  body: string;
  data?: NotificationData;
}

/**
 * Push subscription object
 */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * User notification preferences
 */
export interface UserNotificationPrefs {
  pushEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  driverAssigned: boolean;
  outForDelivery: boolean;
  arrivingSoon: boolean;
  delivered: boolean;
  delayed: boolean;
  platformStatus: boolean;
  enabledPlatforms: string[] | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: UserNotificationPrefs = {
  pushEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  driverAssigned: true,
  outForDelivery: true,
  arrivingSoon: true,
  delivered: true,
  delayed: true,
  platformStatus: true,
  enabledPlatforms: null,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

/**
 * Get notification content for a delivery status change
 */
function getDeliveryNotificationContent(
  delivery: UnifiedDelivery,
  _previousStatus?: DeliveryStatus
): NotificationContent {
  const platformName = getPlatformDisplayName(delivery.platform);

  switch (delivery.status) {
    case 'driver_assigned':
      return {
        title: 'Driver Assigned',
        body: `${delivery.driver?.name ?? 'Your driver'} is picking up your ${platformName} order`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };

    case 'out_for_delivery':
      return {
        title: 'On the Way',
        body: `Your ${platformName} order is out for delivery - arriving in ~${delivery.eta.minutesRemaining} min`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };

    case 'arriving':
      return {
        title: 'Almost There!',
        body: `Your ${platformName} order arrives in ${delivery.eta.minutesRemaining} minutes`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };

    case 'delivered':
      return {
        title: 'Delivered',
        body: `Your ${platformName} order has been delivered`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };

    case 'delayed':
      return {
        title: 'Delivery Delayed',
        body: `Your ${platformName} order is running late - new ETA: ${delivery.eta.minutesRemaining} min`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };

    case 'cancelled':
      return {
        title: 'Order Cancelled',
        body: `Your ${platformName} order has been cancelled`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };

    default:
      return {
        title: 'Delivery Update',
        body: `Your ${platformName} order status: ${delivery.statusLabel}`,
        data: {
          deliveryId: delivery.id,
          platform: delivery.platform,
          status: delivery.status,
          actionUrl: `/delivery/${delivery.id}`,
        },
      };
  }
}

/**
 * Get platform display name
 */
function getPlatformDisplayName(platform: Platform): string {
  const names: Record<Platform, string> = {
    doordash: 'DoorDash',
    ubereats: 'Uber Eats',
    instacart: 'Instacart',
    amazon: 'Amazon',
    amazon_fresh: 'Amazon Fresh',
    walmart: 'Walmart+',
    shipt: 'Shipt',
    drizly: 'Drizly',
    totalwine: 'Total Wine',
    costco: 'Costco',
    samsclub: "Sam's Club",
  };
  return names[platform] ?? platform;
}

/**
 * Map delivery status to notification type
 */
function getNotificationTypeFromStatus(status: DeliveryStatus): NotificationType {
  const mapping: Partial<Record<DeliveryStatus, NotificationType>> = {
    driver_assigned: 'driver_assigned',
    out_for_delivery: 'out_for_delivery',
    arriving: 'arriving_soon',
    delivered: 'delivered',
    delayed: 'delay_detected',
  };
  return mapping[status] ?? 'delivery_status_change';
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(prefs: UserNotificationPrefs): boolean {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour = 0, startMin = 0] = prefs.quietHoursStart.split(':').map(Number);
  const [endHour = 0, endMin = 0] = prefs.quietHoursEnd.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Check if notification type is enabled for user
 */
function isNotificationTypeEnabled(type: NotificationType, prefs: UserNotificationPrefs): boolean {
  switch (type) {
    case 'driver_assigned':
      return prefs.driverAssigned;
    case 'out_for_delivery':
      return prefs.outForDelivery;
    case 'arriving_soon':
      return prefs.arrivingSoon;
    case 'delivered':
      return prefs.delivered;
    case 'delay_detected':
      return prefs.delayed;
    case 'platform_connected':
    case 'platform_disconnected':
      return prefs.platformStatus;
    default:
      return true;
  }
}

/**
 * Check if platform notifications are enabled
 */
function isPlatformEnabled(platform: Platform, prefs: UserNotificationPrefs): boolean {
  // null means all platforms enabled
  if (prefs.enabledPlatforms === null) return true;
  return prefs.enabledPlatforms.includes(platform);
}

/**
 * NotificationService class
 * Handles all notification-related operations
 */
export class NotificationService {
  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPrefs> {
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    if (!prefs) {
      return DEFAULT_PREFERENCES;
    }

    return {
      pushEnabled: prefs.pushEnabled,
      inAppEnabled: prefs.inAppEnabled,
      soundEnabled: prefs.soundEnabled,
      driverAssigned: prefs.driverAssigned,
      outForDelivery: prefs.outForDelivery,
      arrivingSoon: prefs.arrivingSoon,
      delivered: prefs.delivered,
      delayed: prefs.delayed,
      platformStatus: prefs.platformStatus,
      enabledPlatforms: prefs.enabledPlatforms,
      quietHoursEnabled: prefs.quietHoursEnabled,
      quietHoursStart: prefs.quietHoursStart,
      quietHoursEnd: prefs.quietHoursEnd,
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<UserNotificationPrefs>
  ): Promise<void> {
    await db
      .insert(notificationPreferences)
      .values({
        userId,
        ...DEFAULT_PREFERENCES,
        ...updates,
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: updates,
      });
  }

  /**
   * Register a push subscription
   */
  async registerPushSubscription(
    userId: string,
    subscription: PushSubscriptionData,
    userAgent?: string
  ): Promise<string> {
    const result = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          lastUsedAt: new Date(),
        },
      })
      .returning({ id: pushSubscriptions.id });

    return result[0]?.id ?? '';
  }

  /**
   * Remove a push subscription
   */
  async removePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  /**
   * Get user's push subscriptions
   */
  async getPushSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
    const subs = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    return subs.map((sub) => ({
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }));
  }

  /**
   * Send a delivery update notification
   */
  async sendDeliveryUpdate(
    userId: string,
    delivery: UnifiedDelivery,
    previousStatus?: DeliveryStatus
  ): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);
    const notificationType = getNotificationTypeFromStatus(delivery.status);

    // Check quiet hours
    if (isQuietHours(prefs)) {
      console.log(`[Notifications] Quiet hours active for user ${userId}`);
      return false;
    }

    // Check if notification type is enabled
    if (!isNotificationTypeEnabled(notificationType, prefs)) {
      console.log(`[Notifications] Type ${notificationType} disabled for user ${userId}`);
      return false;
    }

    // Check if platform is enabled
    if (!isPlatformEnabled(delivery.platform, prefs)) {
      console.log(`[Notifications] Platform ${delivery.platform} disabled for user ${userId}`);
      return false;
    }

    const content = getDeliveryNotificationContent(delivery, previousStatus);

    // Store in-app notification
    if (prefs.inAppEnabled) {
      await this.storeNotification(userId, notificationType, content);
    }

    // Send push notification
    if (prefs.pushEnabled) {
      await this.sendPushNotifications(userId, content);
    }

    // Emit for real-time in-app display
    await this.emitNotification(userId, notificationType, content);

    return true;
  }

  /**
   * Send a platform connection status notification
   */
  async sendPlatformStatusNotification(
    userId: string,
    platform: Platform,
    status: 'connected' | 'disconnected' | 'error'
  ): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);

    if (isQuietHours(prefs) || !prefs.platformStatus) {
      return false;
    }

    const platformName = getPlatformDisplayName(platform);
    const notificationType: NotificationType =
      status === 'connected' ? 'platform_connected' : 'platform_disconnected';

    const content: NotificationContent = {
      title: status === 'connected' ? 'Platform Connected' : 'Platform Disconnected',
      body:
        status === 'connected'
          ? `${platformName} has been connected to your account`
          : `${platformName} has been disconnected. Reconnect to continue tracking.`,
      data: {
        platform,
        actionUrl: '/settings/platforms',
      },
    };

    if (prefs.inAppEnabled) {
      await this.storeNotification(userId, notificationType, content);
    }

    if (prefs.pushEnabled) {
      await this.sendPushNotifications(userId, content);
    }

    await this.emitNotification(userId, notificationType, content);

    return true;
  }

  /**
   * Store a notification in the database
   */
  private async storeNotification(
    userId: string,
    type: NotificationType,
    content: NotificationContent
  ): Promise<string> {
    const result = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title: content.title,
        body: content.body,
        data: content.data ?? null,
      })
      .returning({ id: notifications.id });

    return result[0]?.id ?? '';
  }

  /**
   * Send push notifications to all user devices
   */
  private async sendPushNotifications(
    userId: string,
    _content: NotificationContent
  ): Promise<void> {
    // Note: In production, this would use the web-push library
    // For now, we'll log the intent and update the notification record
    const subs = await this.getPushSubscriptions(userId);

    if (subs.length === 0) {
      console.log(`[Notifications] No push subscriptions for user ${userId}`);
      return;
    }

    console.log(`[Notifications] Would send push to ${subs.length} devices for user ${userId}`);

    // In production:
    // import webpush from 'web-push';
    // for (const sub of subs) {
    //   await webpush.sendNotification(sub, JSON.stringify({
    //     title: content.title,
    //     body: content.body,
    //     data: content.data,
    //   }));
    // }
  }

  /**
   * Emit notification for real-time display
   */
  private async emitNotification(
    userId: string,
    type: NotificationType,
    content: NotificationContent
  ): Promise<void> {
    const channel = ablyChannels.userNotifications(userId);

    await publishToChannel(channel, 'notification', {
      type,
      ...content,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get user's notifications with pagination
   */
  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{
    items: Array<{
      id: string;
      type: NotificationType;
      title: string;
      body: string;
      data: NotificationData | null;
      read: boolean;
      createdAt: Date;
    }>;
    unreadCount: number;
  }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options;

    const baseWhere = eq(notifications.userId, userId);
    const where = unreadOnly ? and(baseWhere, eq(notifications.read, false)) : baseWhere;

    const items = await db.query.notifications.findMany({
      where,
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });

    // Get unread count
    const unreadItems = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, userId), eq(notifications.read, false)),
    });

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        data: n.data,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadCount: unreadItems.length,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
