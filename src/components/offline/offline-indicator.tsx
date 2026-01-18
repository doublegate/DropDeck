'use client';

/**
 * Offline Indicator Component
 * Shows offline status to users
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useReducedMotion } from '@/lib/accessibility';
import { getAccessibleVariants, slideUpVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';

/**
 * Props for OfflineIndicator
 */
interface OfflineIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom';
  /** Additional CSS classes */
  className?: string;
  /** Show when online (for testing) */
  showWhenOnline?: boolean;
}

/**
 * OfflineIndicator component
 * Shows a banner when the user is offline
 */
export const OfflineIndicator = memo(function OfflineIndicator({
  position = 'bottom',
  className,
  showWhenOnline = false,
}: OfflineIndicatorProps) {
  const { isOnline, isJustChanged } = useOnlineStatus();
  const reducedMotion = useReducedMotion();
  const variants = getAccessibleVariants(slideUpVariants, reducedMotion);

  // Show when offline, or when just came back online (briefly)
  const shouldShow = !isOnline || (isJustChanged && isOnline) || showWhenOnline;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          role="alert"
          aria-live="polite"
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'fixed left-0 right-0 z-50',
            position === 'top' ? 'top-0' : 'bottom-0',
            className
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
              isOnline
                ? 'bg-green-500 text-white'
                : 'bg-[var(--dd-bg-secondary)] text-[var(--dd-text-primary)] border-t border-[var(--dd-border)]'
            )}
          >
            {isOnline ? (
              <>
                <OnlineIcon />
                <span>You're back online</span>
              </>
            ) : (
              <>
                <OfflineIcon />
                <span>You're offline. Some features may be unavailable.</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

/**
 * Compact offline indicator for header/status bar
 */
export const OfflineStatusBadge = memo(function OfflineStatusBadge({
  className,
}: {
  className?: string;
}) {
  const { isOnline, isSlowConnection } = useOnlineStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full',
        !isOnline
          ? 'bg-red-500/10 text-red-500'
          : isSlowConnection
            ? 'bg-yellow-500/10 text-yellow-600'
            : '',
        className
      )}
    >
      {!isOnline ? (
        <>
          <OfflineIcon className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : isSlowConnection ? (
        <>
          <SlowConnectionIcon className="h-3 w-3" />
          <span>Slow</span>
        </>
      ) : null}
    </div>
  );
});

/**
 * Connection quality indicator
 */
export const ConnectionQuality = memo(function ConnectionQuality({
  className,
}: {
  className?: string;
}) {
  const { isOnline, effectiveType, isSlowConnection } = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-2 text-red-500', className)}>
        <OfflineIcon className="h-4 w-4" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  const quality = isSlowConnection ? 'poor' : effectiveType === '4g' ? 'good' : 'moderate';
  const colors = {
    good: 'text-green-500',
    moderate: 'text-yellow-500',
    poor: 'text-red-500',
  };

  return (
    <div className={cn('flex items-center gap-2', colors[quality], className)}>
      <ConnectionBars quality={quality} className="h-4 w-4" />
      <span className="text-sm capitalize">{effectiveType || quality}</span>
    </div>
  );
});

/**
 * Offline icon
 */
function OfflineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>
  );
}

/**
 * Online icon
 */
function OnlineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
      />
    </svg>
  );
}

/**
 * Slow connection icon
 */
function SlowConnectionIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Connection bars indicator
 */
function ConnectionBars({
  quality,
  className,
}: {
  quality: 'good' | 'moderate' | 'poor';
  className?: string;
}) {
  const bars = quality === 'good' ? 3 : quality === 'moderate' ? 2 : 1;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-4 w-4', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="16" width="4" height="6" rx="1" opacity={bars >= 1 ? 1 : 0.3} />
      <rect x="9" y="10" width="4" height="12" rx="1" opacity={bars >= 2 ? 1 : 0.3} />
      <rect x="16" y="4" width="4" height="18" rx="1" opacity={bars >= 3 ? 1 : 0.3} />
    </svg>
  );
}

export default OfflineIndicator;
