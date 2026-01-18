'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Package,
  Truck,
  UserCheck,
  AlertTriangle,
  Link2,
  Link2Off,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationItem } from '@/hooks/use-notifications';

/**
 * NotificationList props
 */
interface NotificationListProps {
  /** Notifications to display */
  notifications: NotificationItem[];
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: NotificationItem) => void;
  /** Callback to mark as read */
  onMarkAsRead?: (notificationId: string) => void;
  /** Callback to mark all as read */
  onMarkAllAsRead?: () => void;
  /** Callback to clear all */
  onClearAll?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Max items to show */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type: string) {
  switch (type) {
    case 'driver_assigned':
      return UserCheck;
    case 'out_for_delivery':
      return Truck;
    case 'arriving_soon':
      return Truck;
    case 'delivered':
      return Package;
    case 'delay_detected':
      return AlertTriangle;
    case 'platform_connected':
      return Link2;
    case 'platform_disconnected':
      return Link2Off;
    default:
      return Bell;
  }
}

/**
 * Get color for notification type
 */
function getNotificationColor(type: string): string {
  switch (type) {
    case 'delivered':
      return 'text-success';
    case 'delay_detected':
      return 'text-warning';
    case 'platform_disconnected':
      return 'text-urgent';
    case 'arriving_soon':
    case 'out_for_delivery':
      return 'text-brand-cyan';
    default:
      return 'text-[var(--dd-text-secondary)]';
  }
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Group notifications by date
 */
function groupByDate(notifications: NotificationItem[]): Map<string, NotificationItem[]> {
  const groups = new Map<string, NotificationItem[]>();

  notifications.forEach((notification) => {
    const date = notification.createdAt;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(notification);
  });

  return groups;
}

/**
 * Single notification item component
 */
interface NotificationItemComponentProps {
  notification: NotificationItem;
  onClick?: () => void;
  onMarkAsRead?: () => void;
}

function NotificationItemComponent({
  notification,
  onClick,
  onMarkAsRead,
}: NotificationItemComponentProps) {
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        'hover:bg-[var(--dd-bg-tertiary)]',
        !notification.read && 'bg-[var(--dd-bg-secondary)]'
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
          'bg-[var(--dd-bg-tertiary)]'
        )}
      >
        <Icon className={cn('w-4 h-4', iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-sm truncate',
              notification.read
                ? 'text-[var(--dd-text-secondary)]'
                : 'text-[var(--dd-text-primary)] font-medium'
            )}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-[var(--dd-text-muted)] whitespace-nowrap">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-[var(--dd-text-muted)] line-clamp-2 mt-0.5">
          {notification.body}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="flex-shrink-0 mt-2">
          <div className="w-2 h-2 rounded-full bg-brand-cyan" />
        </div>
      )}

      {/* Mark as read button (visible on hover) */}
      {!notification.read && onMarkAsRead && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead();
          }}
          aria-label="Mark as read"
        >
          <Check className="w-3 h-3" />
        </Button>
      )}
    </motion.div>
  );
}

/**
 * NotificationList component
 * Displays grouped notifications with actions
 */
export function NotificationList({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  isLoading = false,
  maxItems = 20,
  className,
}: NotificationListProps) {
  const displayedNotifications = notifications.slice(0, maxItems);
  const groupedNotifications = useMemo(
    () => groupByDate(displayedNotifications),
    [displayedNotifications]
  );
  const hasUnread = notifications.some((n) => !n.read);

  if (isLoading) {
    return (
      <div className={cn('p-4 space-y-4', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <BellOff className="w-10 h-10 mx-auto text-[var(--dd-text-muted)] mb-3" />
        <p className="text-sm text-[var(--dd-text-secondary)]">No notifications yet</p>
        <p className="text-xs text-[var(--dd-text-muted)] mt-1">
          You&apos;ll see delivery updates here
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--dd-border)]">
        <h3 className="text-sm font-semibold text-[var(--dd-text-primary)]">Notifications</h3>
        <div className="flex items-center gap-1">
          {hasUnread && onMarkAllAsRead && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onMarkAllAsRead}>
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-[var(--dd-text-muted)]"
              onClick={onClearAll}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Notification groups */}
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        <AnimatePresence mode="popLayout">
          {Array.from(groupedNotifications.entries()).map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-0 px-3 py-1.5 bg-[var(--dd-bg-primary)] border-b border-[var(--dd-border)]">
                <span className="text-[10px] font-medium text-[var(--dd-text-muted)] uppercase tracking-wide">
                  {date}
                </span>
              </div>
              <div className="p-1">
                {items.map((notification) => (
                  <NotificationItemComponent
                    key={notification.id}
                    notification={notification}
                    onClick={() => onNotificationClick?.(notification)}
                    onMarkAsRead={() => onMarkAsRead?.(notification.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {notifications.length > maxItems && (
        <div className="p-2 border-t border-[var(--dd-border)] text-center">
          <Button variant="ghost" size="sm" className="text-xs text-brand-cyan">
            View all {notifications.length} notifications
          </Button>
        </div>
      )}
    </div>
  );
}

export type { NotificationListProps };
