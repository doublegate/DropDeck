'use client';

/**
 * Offline Fallback Component
 * Content to show when app is offline
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { memo, type ReactNode } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { cn } from '@/lib/utils';

/**
 * Props for OfflineFallback
 */
interface OfflineFallbackProps {
  /** Content to show when online */
  children: ReactNode;
  /** Content to show when offline */
  fallback?: ReactNode;
  /** Whether to show children in offline mode (degraded experience) */
  showChildrenOffline?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * OfflineFallback component
 * Conditionally renders content based on online status
 */
export const OfflineFallback = memo(function OfflineFallback({
  children,
  fallback,
  showChildrenOffline = false,
  className,
}: OfflineFallbackProps) {
  const { isOnline } = useOnlineStatus();

  if (!isOnline && !showChildrenOffline) {
    return <>{fallback || <DefaultOfflineFallback className={className} />}</>;
  }

  return <>{children}</>;
});

/**
 * Default offline fallback UI
 */
export const DefaultOfflineFallback = memo(function DefaultOfflineFallback({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        'min-h-[300px]',
        className
      )}
    >
      {/* Offline illustration */}
      <div className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 text-[var(--dd-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-[var(--dd-text-primary)] mb-2">You're Offline</h2>
      <p className="text-[var(--dd-text-muted)] max-w-md mb-6">
        It looks like you've lost your internet connection. Please check your network settings and
        try again.
      </p>

      {/* Suggestions */}
      <div className="text-left text-sm text-[var(--dd-text-muted)] space-y-2">
        <p className="flex items-center gap-2">
          <span className="text-brand-cyan">1.</span>
          Check your Wi-Fi or cellular data connection
        </p>
        <p className="flex items-center gap-2">
          <span className="text-brand-cyan">2.</span>
          Try refreshing the page
        </p>
        <p className="flex items-center gap-2">
          <span className="text-brand-cyan">3.</span>
          Wait a moment and try again
        </p>
      </div>

      {/* Retry button */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={cn(
          'mt-6 px-6 py-2 rounded-lg font-medium',
          'bg-brand-cyan text-white',
          'hover:bg-brand-cyan/90 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2'
        )}
      >
        Retry Connection
      </button>
    </div>
  );
});

/**
 * Offline-aware wrapper that shows degraded state
 */
export const OfflineAware = memo(function OfflineAware({
  children,
  offlineMessage = 'Some features may be unavailable while offline',
  className,
}: {
  children: ReactNode;
  offlineMessage?: string;
  className?: string;
}) {
  const { isOnline } = useOnlineStatus();

  return (
    <div className={cn('relative', className)}>
      {children}

      {/* Offline overlay */}
      {!isOnline && (
        <div className="absolute inset-x-0 bottom-0 p-2 bg-yellow-500/10 border-t border-yellow-500/20">
          <p className="text-xs text-center text-yellow-600 dark:text-yellow-400">
            {offlineMessage}
          </p>
        </div>
      )}
    </div>
  );
});

/**
 * Cached content wrapper
 * Shows cached data when offline with indicator
 */
export const CachedContent = memo(function CachedContent({
  children,
  lastUpdated,
  className,
}: {
  children: ReactNode;
  lastUpdated?: Date | null;
  className?: string;
}) {
  const { isOnline } = useOnlineStatus();

  return (
    <div className={cn('relative', className)}>
      {children}

      {/* Cached indicator */}
      {!isOnline && lastUpdated && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs bg-[var(--dd-bg-secondary)] border border-[var(--dd-border)] rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-[var(--dd-text-muted)]"
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
          <span className="text-[var(--dd-text-muted)]">{formatTimeAgo(lastUpdated)}</span>
        </div>
      )}
    </div>
  );
});

/**
 * Format time ago string
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default OfflineFallback;
