'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationList } from './notification-list';
import type { NotificationItem } from '@/hooks/use-notifications';

/**
 * NotificationBell props
 */
interface NotificationBellProps {
  /** Notifications to display */
  notifications: NotificationItem[];
  /** Unread count */
  unreadCount: number;
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
  /** Additional CSS classes */
  className?: string;
}

/**
 * NotificationBell component
 * Header icon with unread count and dropdown
 */
export function NotificationBell({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  isLoading = false,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      setHasNewNotification(true);
      const timeout = setTimeout(() => setHasNewNotification(false), 500);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [unreadCount, isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <motion.div
            animate={hasNewNotification ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell className="h-5 w-5 text-[var(--dd-text-secondary)]" />
          </motion.div>

          {/* Unread badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={cn(
                  'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                  'min-w-[18px] h-[18px] px-1 rounded-full',
                  'bg-urgent text-white text-[10px] font-bold',
                  'shadow-sm'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 max-h-[70vh] overflow-hidden"
        sideOffset={8}
      >
        <NotificationList
          notifications={notifications}
          onNotificationClick={(notification) => {
            onNotificationClick?.(notification);
            onMarkAsRead?.(notification.id);
          }}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onClearAll={onClearAll}
          isLoading={isLoading}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { NotificationBellProps };
