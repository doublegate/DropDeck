'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  MapPin,
  Navigation,
  Package,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';
import { PLATFORM_CONFIGS, type Platform } from '@/types/platform';
import { ETADisplayCompact } from './eta-display';

/**
 * DeliveryCard props
 */
interface DeliveryCardProps {
  /** Delivery data */
  delivery: UnifiedDelivery;
  /** Whether card is selected */
  isSelected?: boolean;
  /** Whether card is expanded */
  isExpanded?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Expand handler */
  onExpand?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status icon mapping
 */
const STATUS_ICONS: Record<DeliveryStatus, typeof Package> = {
  preparing: ChefHat,
  ready_for_pickup: Package,
  driver_assigned: User,
  driver_heading_to_store: Navigation,
  driver_at_store: Package,
  out_for_delivery: Truck,
  arriving: MapPin,
  delivered: CheckCircle2,
  cancelled: XCircle,
  delayed: AlertTriangle,
};

/**
 * Status colors from Design System
 */
const STATUS_COLORS: Record<DeliveryStatus, { text: string; bg: string; border: string }> = {
  preparing: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
  ready_for_pickup: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
  driver_assigned: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
  },
  driver_heading_to_store: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
  },
  driver_at_store: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
  },
  out_for_delivery: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
  },
  arriving: {
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/15',
    border: 'border-brand-cyan/40',
  },
  delivered: {
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  cancelled: {
    text: 'text-urgent',
    bg: 'bg-urgent/10',
    border: 'border-urgent/30',
  },
  delayed: {
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
  },
};

/**
 * Get platform color styles
 */
function getPlatformStyles(platform: Platform) {
  const config = PLATFORM_CONFIGS[platform];
  return {
    color: config?.color ?? '#64748B',
    name: config?.name ?? platform,
  };
}

/**
 * Progress indicator component
 */
function ProgressIndicator({ status }: { status: DeliveryStatus }) {
  const stages = ['preparing', 'out_for_delivery', 'arriving', 'delivered'];
  const currentStageIndex = useMemo(() => {
    if (status === 'cancelled') return -1;
    if (status === 'delayed') return stages.indexOf('out_for_delivery');
    if (
      [
        'driver_assigned',
        'driver_heading_to_store',
        'driver_at_store',
        'ready_for_pickup',
      ].includes(status)
    ) {
      return 0.5; // Between preparing and out_for_delivery
    }
    return stages.indexOf(status);
  }, [status]);

  if (status === 'cancelled') {
    return null;
  }

  return (
    <div className="flex items-center gap-1 mt-3">
      {stages.map((stage, index) => (
        <div key={stage} className="flex items-center flex-1">
          <div
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index <= currentStageIndex ? 'bg-brand-cyan' : 'bg-[var(--dd-bg-tertiary)]'
            )}
          />
          {index < stages.length - 1 && <div className="w-1" />}
        </div>
      ))}
    </div>
  );
}

/**
 * DeliveryCard component
 * Design System compliant delivery card with platform branding
 */
export function DeliveryCard({
  delivery,
  isSelected = false,
  isExpanded = false,
  onClick,
  onExpand,
  className,
}: DeliveryCardProps) {
  const platformStyles = getPlatformStyles(delivery.platform);
  const statusColors = STATUS_COLORS[delivery.status];
  const StatusIcon = STATUS_ICONS[delivery.status];
  const isActive = !['delivered', 'cancelled'].includes(delivery.status);
  const isArriving = delivery.status === 'arriving' || delivery.eta.minutesRemaining <= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200',
          'hover:shadow-md',
          isSelected && 'ring-2 ring-brand-cyan',
          isArriving &&
            isActive &&
            'ring-1 ring-brand-cyan/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          {/* Header row: Platform badge + ETA */}
          <div className="flex items-center justify-between mb-3">
            {/* Platform badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
              style={{
                backgroundColor: `${platformStyles.color}15`,
                color: platformStyles.color,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: platformStyles.color }}
              />
              {platformStyles.name}
            </div>

            {/* ETA */}
            {isActive && <ETADisplayCompact delivery={delivery} />}
            {delivery.status === 'delivered' && (
              <span className="text-sm font-medium text-success">Delivered</span>
            )}
            {delivery.status === 'cancelled' && (
              <span className="text-sm font-medium text-urgent">Cancelled</span>
            )}
          </div>

          {/* Status row */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
                statusColors.text,
                statusColors.bg,
                statusColors.border,
                isArriving && isActive && 'animate-pulse'
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {delivery.statusLabel}
            </div>

            {delivery.status === 'delayed' && <span className="text-xs text-warning">Delayed</span>}
          </div>

          {/* Driver info (if available) */}
          {delivery.driver?.name && isActive && (
            <div className="flex items-center gap-2 mb-2 text-xs text-[var(--dd-text-secondary)]">
              <User className="w-3.5 h-3.5" />
              <span>{delivery.driver.name}</span>
              {delivery.driver.vehicle?.color && delivery.driver.vehicle?.make && (
                <span className="text-[var(--dd-text-muted)]">
                  {delivery.driver.vehicle.color} {delivery.driver.vehicle.make}
                </span>
              )}
            </div>
          )}

          {/* Destination */}
          <div className="flex items-start gap-2 text-xs text-[var(--dd-text-muted)]">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{delivery.destination.address}</span>
          </div>

          {/* Order summary */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--dd-border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--dd-text-muted)]">
              <Package className="w-3.5 h-3.5" />
              <span>
                {delivery.order.itemCount} item{delivery.order.itemCount !== 1 ? 's' : ''}
              </span>
              {delivery.order.totalAmount && (
                <span>${(delivery.order.totalAmount / 100).toFixed(2)}</span>
              )}
            </div>

            {onExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                className="flex items-center gap-1 text-xs text-brand-cyan hover:underline"
              >
                Details
                <ChevronRight
                  className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-90')}
                />
              </button>
            )}
          </div>

          {/* Progress indicator */}
          <ProgressIndicator status={delivery.status} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * DeliveryCard skeleton for loading state
 */
export function DeliveryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-24 rounded-md bg-[var(--dd-bg-tertiary)]" />
          <div className="h-6 w-16 rounded-md bg-[var(--dd-bg-tertiary)]" />
        </div>

        {/* Status */}
        <div className="h-6 w-32 rounded-md bg-[var(--dd-bg-tertiary)] mb-2" />

        {/* Driver */}
        <div className="h-4 w-40 rounded bg-[var(--dd-bg-tertiary)] mb-2" />

        {/* Address */}
        <div className="h-4 w-full rounded bg-[var(--dd-bg-tertiary)]" />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--dd-border)]">
          <div className="h-4 w-20 rounded bg-[var(--dd-bg-tertiary)]" />
          <div className="h-4 w-16 rounded bg-[var(--dd-bg-tertiary)]" />
        </div>

        {/* Progress */}
        <div className="flex gap-1 mt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full bg-[var(--dd-bg-tertiary)]" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export type { DeliveryCardProps };
