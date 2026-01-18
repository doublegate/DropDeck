'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Package,
  Truck,
  UserCheck,
  AlertTriangle,
  Link2,
  Link2Off,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { NotificationItem } from '@/hooks/use-notifications';

/**
 * Notification types for filtering
 */
const NOTIFICATION_TYPES = [
  { value: 'delivery_status_change', label: 'Status Changes' },
  { value: 'driver_assigned', label: 'Driver Assigned' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'arriving_soon', label: 'Arriving Soon' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delay_detected', label: 'Delays' },
  { value: 'platform_connected', label: 'Platform Connected' },
  { value: 'platform_disconnected', label: 'Platform Disconnected' },
] as const;

/**
 * NotificationCenter props
 */
interface NotificationCenterProps {
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
  /** Callback to delete a notification */
  onDelete?: (notificationId: string) => void;
  /** Loading state */
  isLoading?: boolean;
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
      return 'text-success bg-success/10';
    case 'delay_detected':
      return 'text-warning bg-warning/10';
    case 'platform_disconnected':
      return 'text-urgent bg-urgent/10';
    case 'arriving_soon':
    case 'out_for_delivery':
      return 'text-brand-cyan bg-brand-cyan/10';
    default:
      return 'text-[var(--dd-text-secondary)] bg-[var(--dd-bg-tertiary)]';
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Group notifications by date
 */
function groupNotificationsByDate(
  notifications: NotificationItem[]
): Map<string, NotificationItem[]> {
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
      key = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)?.push(notification);
  });

  return groups;
}

/**
 * Notification card component
 */
interface NotificationCardProps {
  notification: NotificationItem;
  onClick?: () => void;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
}

function NotificationCard({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  const Icon = getNotificationIcon(notification.type);
  const colorClasses = getNotificationColor(notification.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group cursor-pointer transition-all hover:shadow-md',
          !notification.read && 'ring-1 ring-brand-cyan/30'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full',
                colorClasses
              )}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'text-sm',
                      notification.read
                        ? 'text-[var(--dd-text-secondary)]'
                        : 'text-[var(--dd-text-primary)] font-semibold'
                    )}
                  >
                    {notification.title}
                  </h4>
                  <p className="text-sm text-[var(--dd-text-muted)] mt-1">{notification.body}</p>
                  {notification.data?.platform && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-[var(--dd-bg-tertiary)] text-[var(--dd-text-muted)] capitalize">
                      {notification.data.platform.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Unread indicator */}
                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan flex-shrink-0 mt-1" />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--dd-border)]">
                <span className="text-xs text-[var(--dd-text-muted)]">
                  {formatTimestamp(notification.createdAt)}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && onMarkAsRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead();
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Read
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-[var(--dd-text-muted)] hover:text-urgent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * NotificationCenter component
 * Full notification management view
 */
export function NotificationCenter({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDelete,
  isLoading = false,
  className,
}: NotificationCenterProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filter by type
    if (selectedTypes.size > 0) {
      filtered = filtered.filter((n) => selectedTypes.has(n.type));
    }

    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    return filtered;
  }, [notifications, selectedTypes, showUnreadOnly]);

  // Group by date
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasFilters = selectedTypes.size > 0 || showUnreadOnly;

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
    setShowUnreadOnly(false);
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--dd-text-primary)]">Notifications</h2>
          <p className="text-sm text-[var(--dd-text-muted)]">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={cn(hasFilters && 'border-brand-cyan')}>
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {hasFilters && (
                  <span className="ml-1 px-1.5 py-0.5 bg-brand-cyan text-white text-xs rounded-full">
                    {selectedTypes.size + (showUnreadOnly ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {NOTIFICATION_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type.value}
                  checked={selectedTypes.has(type.value)}
                  onCheckedChange={() => toggleType(type.value)}
                >
                  {type.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showUnreadOnly}
                onCheckedChange={setShowUnreadOnly}
              >
                Unread only
              </DropdownMenuCheckboxItem>
              {hasFilters && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-brand-cyan"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--dd-text-muted)]"
              onClick={onClearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BellOff className="w-12 h-12 mx-auto text-[var(--dd-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--dd-text-primary)]">
              {hasFilters ? 'No matching notifications' : 'No notifications'}
            </h3>
            <p className="text-sm text-[var(--dd-text-muted)] mt-2">
              {hasFilters
                ? 'Try adjusting your filters'
                : "You'll see delivery updates and alerts here"}
            </p>
            {hasFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification groups */}
      <AnimatePresence mode="popLayout">
        {Array.from(groupedNotifications.entries()).map(([date, items]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-[var(--dd-text-muted)] sticky top-0 bg-[var(--dd-bg-primary)] py-2 z-10">
              {date}
            </h3>
            <div className="space-y-3">
              {items.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => onNotificationClick?.(notification)}
                  onMarkAsRead={() => onMarkAsRead?.(notification.id)}
                  onDelete={() => onDelete?.(notification.id)}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export type { NotificationCenterProps };
