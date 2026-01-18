'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Car,
  ChefHat,
  ClipboardCheck,
  MapPin,
  PackageCheck,
  Store,
  Truck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';

/**
 * ETATimeline props
 */
interface ETATimelineProps {
  /** Delivery to show timeline for */
  delivery: UnifiedDelivery;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status configuration with icons and labels
 */
const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    icon: typeof ClipboardCheck;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  preparing: {
    icon: ChefHat,
    label: 'Preparing',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
  ready_for_pickup: {
    icon: ClipboardCheck,
    label: 'Ready for Pickup',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
  driver_assigned: {
    icon: UserCheck,
    label: 'Driver Assigned',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
  driver_heading_to_store: {
    icon: Car,
    label: 'Driver En Route',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
  driver_at_store: {
    icon: Store,
    label: 'Driver at Store',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
  out_for_delivery: {
    icon: Truck,
    label: 'Out for Delivery',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
  arriving: {
    icon: MapPin,
    label: 'Arriving',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
  delivered: {
    icon: PackageCheck,
    label: 'Delivered',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  delayed: {
    icon: AlertTriangle,
    label: 'Delayed',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
};

/**
 * Order of statuses for timeline display
 */
const STATUS_ORDER: DeliveryStatus[] = [
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'driver_heading_to_store',
  'driver_at_store',
  'out_for_delivery',
  'arriving',
  'delivered',
];

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get status index for comparison
 */
function getStatusIndex(status: DeliveryStatus): number {
  const index = STATUS_ORDER.indexOf(status);
  return index >= 0 ? index : STATUS_ORDER.length;
}

/**
 * Determine if a status is complete
 */
function isStatusComplete(status: DeliveryStatus, currentStatus: DeliveryStatus): boolean {
  return getStatusIndex(status) < getStatusIndex(currentStatus);
}

/**
 * Determine if a status is current
 */
function isStatusCurrent(status: DeliveryStatus, currentStatus: DeliveryStatus): boolean {
  return status === currentStatus;
}

/**
 * TimelineStep component
 */
interface TimelineStepProps {
  status: DeliveryStatus;
  currentStatus: DeliveryStatus;
  timestamp?: Date;
  isLast: boolean;
  showTimestamp: boolean;
  compact: boolean;
}

function TimelineStep({
  status,
  currentStatus,
  timestamp,
  isLast,
  showTimestamp,
  compact,
}: TimelineStepProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const isComplete = isStatusComplete(status, currentStatus);
  const isCurrent = isStatusCurrent(status, currentStatus);
  const isPending = !isComplete && !isCurrent;

  return (
    <div className={cn('relative flex', compact ? 'gap-2' : 'gap-3')}>
      {/* Line connector */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-3 top-6 w-0.5 h-full -translate-x-1/2',
            isComplete ? 'bg-success' : 'bg-[var(--dd-border)]'
          )}
        />
      )}

      {/* Icon */}
      <motion.div
        initial={false}
        animate={{
          scale: isCurrent ? 1.1 : 1,
          backgroundColor: isComplete || isCurrent ? config.color : 'var(--dd-bg-tertiary)',
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative z-10 flex items-center justify-center rounded-full',
          compact ? 'w-5 h-5' : 'w-6 h-6',
          (isComplete || isCurrent) && 'shadow-sm'
        )}
      >
        <Icon
          className={cn(
            compact ? 'w-3 h-3' : 'w-3.5 h-3.5',
            isComplete || isCurrent ? 'text-white' : 'text-[var(--dd-text-muted)]'
          )}
        />
        {/* Pulse animation for current status */}
        {isCurrent && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: config.color }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', compact && 'pb-2')}>
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-medium',
              compact ? 'text-xs' : 'text-sm',
              isPending ? 'text-[var(--dd-text-muted)]' : 'text-[var(--dd-text-primary)]'
            )}
          >
            {config.label}
          </span>
          {showTimestamp && timestamp && (
            <span
              className={cn('text-[var(--dd-text-muted)]', compact ? 'text-[10px]' : 'text-xs')}
            >
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ETATimeline component
 * Shows order progression with animated milestones
 */
export function ETATimeline({
  delivery,
  showTimestamps = true,
  compact = false,
  className,
}: ETATimelineProps) {
  // Get relevant timeline statuses based on delivery type
  const relevantStatuses = useMemo(() => {
    // For cancelled orders, show up to the cancelled status
    if (delivery.status === 'cancelled') {
      const currentIndex = getStatusIndex(delivery.status);
      return STATUS_ORDER.slice(0, Math.min(currentIndex + 1, 3)).concat([
        'cancelled' as DeliveryStatus,
      ]);
    }

    // For normal flow, filter based on platform type
    // Restaurant orders typically skip "ready_for_pickup" and "driver_at_store"
    const isRestaurant = ['doordash', 'ubereats'].includes(delivery.platform);

    return STATUS_ORDER.filter((status) => {
      if (isRestaurant) {
        return !['ready_for_pickup', 'driver_at_store'].includes(status);
      }
      return true;
    });
  }, [delivery.platform, delivery.status]);

  // Map timestamps to statuses
  const timestampMap = useMemo(() => {
    const map: Partial<Record<DeliveryStatus, Date>> = {};

    // From delivery timestamps
    if (delivery.timestamps.preparing) map.preparing = delivery.timestamps.preparing;
    if (delivery.timestamps.readyForPickup)
      map.ready_for_pickup = delivery.timestamps.readyForPickup;
    if (delivery.timestamps.driverAssigned)
      map.driver_assigned = delivery.timestamps.driverAssigned;
    if (delivery.timestamps.pickedUp) map.driver_at_store = delivery.timestamps.pickedUp;
    if (delivery.timestamps.outForDelivery)
      map.out_for_delivery = delivery.timestamps.outForDelivery;
    if (delivery.timestamps.arriving) map.arriving = delivery.timestamps.arriving;
    if (delivery.timestamps.delivered) map.delivered = delivery.timestamps.delivered;
    if (delivery.timestamps.cancelled) map.cancelled = delivery.timestamps.cancelled;

    return map;
  }, [delivery.timestamps]);

  return (
    <div className={cn('relative', className)}>
      {relevantStatuses.map((status, index) => (
        <TimelineStep
          key={status}
          status={status}
          currentStatus={delivery.status}
          timestamp={timestampMap[status]}
          isLast={index === relevantStatuses.length - 1}
          showTimestamp={showTimestamps}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Horizontal timeline variant for space-constrained layouts
 */
export function ETATimelineHorizontal({
  delivery,
  className,
}: Pick<ETATimelineProps, 'delivery' | 'className'>) {
  const relevantStatuses = useMemo(() => {
    const isRestaurant = ['doordash', 'ubereats'].includes(delivery.platform);
    return STATUS_ORDER.filter((status) => {
      if (isRestaurant) {
        return !['ready_for_pickup', 'driver_at_store'].includes(status);
      }
      // Simplified for horizontal view
      return ['preparing', 'out_for_delivery', 'arriving', 'delivered'].includes(status);
    });
  }, [delivery.platform]);

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {relevantStatuses.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const Icon = config.icon;
        const isComplete = isStatusComplete(status, delivery.status);
        const isCurrent = isStatusCurrent(status, delivery.status);

        return (
          <div key={status} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isComplete || isCurrent ? config.color : 'var(--dd-bg-tertiary)',
                }}
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full',
                  (isComplete || isCurrent) && 'shadow-sm'
                )}
              >
                <Icon
                  className={cn(
                    'w-3 h-3',
                    isComplete || isCurrent ? 'text-white' : 'text-[var(--dd-text-muted)]'
                  )}
                />
              </motion.div>
              <span
                className={cn(
                  'text-[10px] whitespace-nowrap',
                  isCurrent
                    ? 'text-[var(--dd-text-primary)] font-medium'
                    : 'text-[var(--dd-text-muted)]'
                )}
              >
                {config.label}
              </span>
            </div>

            {/* Connector line */}
            {index < relevantStatuses.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 min-w-[20px]',
                  isComplete ? 'bg-success' : 'bg-[var(--dd-border)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { ETATimelineProps };
