'use client';

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Link2, Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DeliveryCard, DeliveryCardSkeleton } from './delivery-card';
import type { UnifiedDelivery } from '@/types/delivery';

/**
 * DeliveryGrid props
 */
interface DeliveryGridProps {
  /** Deliveries to display */
  deliveries: UnifiedDelivery[];
  /** Currently selected delivery ID */
  selectedId?: string | null;
  /** Currently expanded delivery ID */
  expandedId?: string | null;
  /** Select handler */
  onSelect?: (deliveryId: string) => void;
  /** Expand handler */
  onExpand?: (deliveryId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Empty state type */
  emptyType?: 'no-deliveries' | 'no-platforms' | 'no-results';
  /** Has active filters */
  hasFilters?: boolean;
  /** Clear filters handler */
  onClearFilters?: () => void;
  /** Connect platforms handler */
  onConnectPlatforms?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state component
 */
function EmptyState({
  type,
  hasFilters,
  onClearFilters,
  onConnectPlatforms,
}: {
  type: 'no-deliveries' | 'no-platforms' | 'no-results';
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onConnectPlatforms?: () => void;
}) {
  const config = useMemo(() => {
    switch (type) {
      case 'no-platforms':
        return {
          icon: Link2,
          title: 'No platforms connected',
          description:
            'Connect your delivery platforms to start tracking your packages in real-time.',
          action: onConnectPlatforms && {
            label: 'Connect Platforms',
            onClick: onConnectPlatforms,
          },
        };
      case 'no-results':
        return {
          icon: hasFilters ? Filter : Search,
          title: hasFilters ? 'No matching deliveries' : 'No results found',
          description: hasFilters
            ? 'Try adjusting your filters to see more deliveries.'
            : 'No deliveries match your search.',
          action: hasFilters &&
            onClearFilters && {
              label: 'Clear Filters',
              onClick: onClearFilters,
            },
        };
      default:
        return {
          icon: Package,
          title: 'No active deliveries',
          description:
            "You don't have any active deliveries right now. Check back when you place an order!",
          action: null,
        };
    }
  }, [type, hasFilters, onClearFilters, onConnectPlatforms]);

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--dd-bg-tertiary)] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-[var(--dd-text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--dd-text-primary)] mb-2">{config.title}</h3>
      <p className="text-sm text-[var(--dd-text-muted)] max-w-sm mb-6">{config.description}</p>
      {config.action && <Button onClick={config.action.onClick}>{config.action.label}</Button>}
    </motion.div>
  );
}

/**
 * Error state component
 */
function ErrorState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-urgent/10 flex items-center justify-center mb-4">
        <X className="w-8 h-8 text-urgent" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--dd-text-primary)] mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-[var(--dd-text-muted)] max-w-sm">{message}</p>
    </motion.div>
  );
}

/**
 * Loading skeleton grid
 */
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <DeliveryCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Container animation variants
 */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * DeliveryGrid component
 * Responsive grid layout for delivery cards
 */
export function DeliveryGrid({
  deliveries,
  selectedId,
  expandedId,
  onSelect,
  onExpand,
  isLoading = false,
  error = null,
  emptyType = 'no-deliveries',
  hasFilters = false,
  onClearFilters,
  onConnectPlatforms,
  className,
}: DeliveryGridProps) {
  const handleSelect = useCallback(
    (deliveryId: string) => {
      onSelect?.(deliveryId);
    },
    [onSelect]
  );

  const handleExpand = useCallback(
    (deliveryId: string) => {
      onExpand?.(deliveryId);
    },
    [onExpand]
  );

  // Loading state
  if (isLoading) {
    return <LoadingGrid />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // Empty state
  if (deliveries.length === 0) {
    return (
      <EmptyState
        type={emptyType}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
        onConnectPlatforms={onConnectPlatforms}
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        // Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop, 4 col wide
        'grid grid-cols-1 gap-4',
        'sm:grid-cols-2 sm:gap-5',
        'lg:grid-cols-3 lg:gap-6',
        'xl:grid-cols-4',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            isSelected={selectedId === delivery.id}
            isExpanded={expandedId === delivery.id}
            onClick={() => handleSelect(delivery.id)}
            onExpand={() => handleExpand(delivery.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export type { DeliveryGridProps };
