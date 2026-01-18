'use client';

/**
 * Virtualized Delivery List Component
 * Uses windowing for efficient rendering of large delivery lists
 * Sprint 5.3 - Performance Optimizations
 */

import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnifiedDelivery } from '@/types/delivery';
import { DeliveryCard, DeliveryCardSkeleton } from './delivery-card';
import { cn } from '@/lib/utils';

/**
 * Props for VirtualizedDeliveryList
 */
interface VirtualizedDeliveryListProps {
  /** List of deliveries to display */
  deliveries: UnifiedDelivery[];
  /** Currently selected delivery ID */
  selectedId?: string | null;
  /** Callback when delivery is clicked */
  onSelect?: (delivery: UnifiedDelivery) => void;
  /** Callback when delivery details are expanded */
  onExpand?: (delivery: UnifiedDelivery) => void;
  /** Estimated height of each item */
  itemHeight?: number;
  /** Number of items to render above/below viewport */
  overscan?: number;
  /** Whether list is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Calculate visible items based on scroll position
 */
function useVirtualization(
  containerRef: React.RefObject<HTMLDivElement | null>,
  itemCount: number,
  itemHeight: number,
  overscan: number
) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: containerRef is a ref, not a reactive dependency
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    setVisibleRange((prev) => {
      if (prev.start !== startIndex || prev.end !== endIndex) {
        return { start: startIndex, end: endIndex };
      }
      return prev;
    });
  }, [itemCount, itemHeight, overscan]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: containerRef is a ref, not a reactive dependency
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial calculation
    handleScroll();

    // Add scroll listener
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Resize observer for container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll]);

  return visibleRange;
}

/**
 * Memoized delivery card wrapper
 */
const MemoizedDeliveryCard = memo(
  function DeliveryCardWrapper({
    delivery,
    isSelected,
    onClick,
    onExpand,
    style,
  }: {
    delivery: UnifiedDelivery;
    isSelected: boolean;
    onClick: () => void;
    onExpand: () => void;
    style: React.CSSProperties;
  }) {
    return (
      <div style={style}>
        <DeliveryCard
          delivery={delivery}
          isSelected={isSelected}
          onClick={onClick}
          onExpand={onExpand}
        />
      </div>
    );
  },
  (prev, next) => {
    // Custom comparison for memoization
    return (
      prev.delivery.id === next.delivery.id &&
      prev.delivery.status === next.delivery.status &&
      prev.delivery.eta.minutesRemaining === next.delivery.eta.minutesRemaining &&
      prev.delivery.driver?.location?.lat === next.delivery.driver?.location?.lat &&
      prev.delivery.driver?.location?.lng === next.delivery.driver?.location?.lng &&
      prev.isSelected === next.isSelected
    );
  }
);

/**
 * VirtualizedDeliveryList component
 * Efficiently renders large lists by only rendering visible items
 */
export function VirtualizedDeliveryList({
  deliveries,
  selectedId,
  onSelect,
  onExpand,
  itemHeight = 200,
  overscan = 3,
  isLoading = false,
  className,
}: VirtualizedDeliveryListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { start, end } = useVirtualization(containerRef, deliveries.length, itemHeight, overscan);

  // Calculate total height for scroll
  const totalHeight = deliveries.length * itemHeight;

  // Get visible deliveries
  const visibleDeliveries = useMemo(() => deliveries.slice(start, end), [deliveries, start, end]);

  // Memoize callbacks
  const handleSelect = useCallback(
    (delivery: UnifiedDelivery) => () => {
      onSelect?.(delivery);
    },
    [onSelect]
  );

  const handleExpand = useCallback(
    (delivery: UnifiedDelivery) => () => {
      onExpand?.(delivery);
    },
    [onExpand]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4 p-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
          <DeliveryCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Empty state
  if (deliveries.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="text-[var(--dd-text-muted)] text-lg mb-2">No active deliveries</div>
        <p className="text-[var(--dd-text-muted)] text-sm">
          Connect a delivery platform to start tracking your orders.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('overflow-y-auto', className)} style={{ height: '100%' }}>
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <AnimatePresence mode="popLayout">
          {visibleDeliveries.map((delivery, index) => {
            const absoluteIndex = start + index;
            return (
              <motion.div
                key={delivery.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <MemoizedDeliveryCard
                  delivery={delivery}
                  isSelected={selectedId === delivery.id}
                  onClick={handleSelect(delivery)}
                  onExpand={handleExpand(delivery)}
                  style={{
                    position: 'absolute',
                    top: absoluteIndex * itemHeight,
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    padding: '8px 16px',
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Simple delivery list for small numbers of items
 * Doesn't use virtualization, better for < 20 items
 */
export function SimpleDeliveryList({
  deliveries,
  selectedId,
  onSelect,
  onExpand,
  isLoading = false,
  className,
}: Omit<VirtualizedDeliveryListProps, 'itemHeight' | 'overscan'>) {
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-4 p-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
          <DeliveryCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="text-[var(--dd-text-muted)] text-lg mb-2">No active deliveries</div>
        <p className="text-[var(--dd-text-muted)] text-sm">
          Connect a delivery platform to start tracking your orders.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      <AnimatePresence mode="popLayout">
        {deliveries.map((delivery) => (
          <DeliveryCard
            key={delivery.id}
            delivery={delivery}
            isSelected={selectedId === delivery.id}
            onClick={() => onSelect?.(delivery)}
            onExpand={() => onExpand?.(delivery)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Smart delivery list that chooses rendering strategy based on item count
 */
export function SmartDeliveryList(props: VirtualizedDeliveryListProps) {
  const { deliveries } = props;

  // Use simple list for small numbers, virtualized for large
  if (deliveries.length <= 20) {
    return <SimpleDeliveryList {...props} />;
  }

  return <VirtualizedDeliveryList {...props} />;
}

export default SmartDeliveryList;
