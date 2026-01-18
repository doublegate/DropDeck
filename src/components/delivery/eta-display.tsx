'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateETA,
  type ETAConfidenceLevel,
  type ETAResult,
  formatETADisplay,
  formatETARange,
  getConfidenceColor,
} from '@/lib/services/eta';
import { cn } from '@/lib/utils';
import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';

/**
 * ETADisplay props
 */
interface ETADisplayProps {
  /** Delivery to calculate ETA for */
  delivery: UnifiedDelivery;
  /** Pre-calculated ETA result (optional, will calculate if not provided) */
  etaResult?: ETAResult;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show confidence indicator */
  showConfidence?: boolean;
  /** Show range for low confidence */
  showRange?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animation variants for ETA number changes
 */
const numberVariants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -10, opacity: 0 },
};

/**
 * Get icon for delivery status
 */
function getStatusIcon(status: DeliveryStatus) {
  switch (status) {
    case 'arriving':
      return Clock;
    case 'delivered':
      return CheckCircle2;
    case 'delayed':
      return AlertTriangle;
    default:
      return Clock;
  }
}

/**
 * Get size-specific styles
 */
function getSizeStyles(size: 'sm' | 'md' | 'lg') {
  switch (size) {
    case 'sm':
      return {
        container: 'gap-1',
        time: 'text-lg font-semibold',
        label: 'text-xs',
        icon: 'w-3 h-3',
        badge: 'px-1.5 py-0.5 text-[10px]',
      };
    case 'lg':
      return {
        container: 'gap-2',
        time: 'text-3xl font-bold',
        label: 'text-sm',
        icon: 'w-5 h-5',
        badge: 'px-2.5 py-1 text-xs',
      };
    default:
      return {
        container: 'gap-1.5',
        time: 'text-2xl font-bold', // Design System: 24px, 700
        label: 'text-xs',
        icon: 'w-4 h-4',
        badge: 'px-2 py-0.5 text-xs',
      };
  }
}

/**
 * Confidence badge component
 */
function ConfidenceBadge({ level, className }: { level: ETAConfidenceLevel; className?: string }) {
  const color = getConfidenceColor(level);

  const labels: Record<ETAConfidenceLevel, string> = {
    high: 'High confidence',
    medium: 'Estimated',
    low: 'Approximate',
  };

  return (
    <span
      className={cn('inline-flex items-center rounded-full font-medium', className)}
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      {labels[level]}
    </span>
  );
}

/**
 * ETADisplay component
 * Shows ETA with animations and confidence indicators
 * Design System compliant: 24px bold, tabular-nums, semantic colors
 */
export function ETADisplay({
  delivery,
  etaResult: providedEta,
  size = 'md',
  showConfidence = true,
  showRange = true,
  className,
}: ETADisplayProps) {
  // Calculate ETA if not provided
  const etaResult = useMemo(() => providedEta ?? calculateETA(delivery), [delivery, providedEta]);

  // Track previous ETA for change detection
  const [previousMinutes, setPreviousMinutes] = useState(etaResult.minutesRemaining);
  const [etaChange, setEtaChange] = useState<'faster' | 'slower' | null>(null);

  // Detect significant ETA changes
  useEffect(() => {
    const difference = etaResult.minutesRemaining - previousMinutes;
    if (Math.abs(difference) >= 3) {
      setEtaChange(difference < 0 ? 'faster' : 'slower');
      // Clear change indicator after 3 seconds
      const timeout = setTimeout(() => setEtaChange(null), 3000);
      return () => clearTimeout(timeout);
    }
    setPreviousMinutes(etaResult.minutesRemaining);
    return undefined;
  }, [etaResult.minutesRemaining, previousMinutes]);

  const styles = getSizeStyles(size);
  // Status icon available for future use
  void getStatusIcon(delivery.status);

  // Determine display colors based on status
  const isArriving = delivery.status === 'arriving' || etaResult.minutesRemaining < 5;
  const isDelivered = delivery.status === 'delivered';
  const isDelayed = delivery.status === 'delayed';

  const timeColor = isDelivered
    ? 'text-success' // Signal Green
    : isArriving
      ? 'text-brand-cyan' // Drop Cyan
      : isDelayed
        ? 'text-warning' // Alert Amber
        : 'text-[var(--dd-text-primary)]';

  // Format the ETA display
  const displayText = formatETADisplay(etaResult.minutesRemaining);
  const rangeText = showRange ? formatETARange(etaResult.range) : null;

  return (
    <div className={cn('flex flex-col', styles.container, className)}>
      {/* Main ETA display */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={displayText}
            variants={numberVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              styles.time,
              timeColor,
              'tabular-nums', // Design System: font-variant-numeric
              isArriving && !isDelivered && 'animate-pulse' // Design System: pulse for arriving
            )}
          >
            {displayText}
          </motion.span>
        </AnimatePresence>

        {/* ETA change indicator */}
        <AnimatePresence>
          {etaChange && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                etaChange === 'faster' ? 'text-success' : 'text-warning'
              )}
            >
              {etaChange === 'faster' ? (
                <>
                  <TrendingDown className="w-3 h-3" />
                  Faster
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3" />
                  Slower
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ETA range (for low/medium confidence) */}
      {rangeText && etaResult.confidenceLevel !== 'high' && (
        <span className={cn('text-[var(--dd-text-muted)]', styles.label)}>Window: {rangeText}</span>
      )}

      {/* Confidence badge */}
      {showConfidence && etaResult.confidenceLevel !== 'high' && (
        <ConfidenceBadge level={etaResult.confidenceLevel} className={styles.badge} />
      )}
    </div>
  );
}

/**
 * Compact ETA display for cards
 */
export function ETADisplayCompact({
  delivery,
  etaResult: providedEta,
  className,
}: Omit<ETADisplayProps, 'size' | 'showConfidence' | 'showRange'>) {
  const etaResult = useMemo(() => providedEta ?? calculateETA(delivery), [delivery, providedEta]);

  const isArriving = delivery.status === 'arriving' || etaResult.minutesRemaining < 5;
  const isDelivered = delivery.status === 'delivered';

  const displayText = formatETADisplay(etaResult.minutesRemaining);

  return (
    <span
      className={cn(
        'text-lg font-semibold tabular-nums',
        isDelivered
          ? 'text-success'
          : isArriving
            ? 'text-brand-cyan animate-pulse'
            : 'text-[var(--dd-text-primary)]',
        className
      )}
    >
      {displayText}
    </span>
  );
}

export type { ETADisplayProps };
