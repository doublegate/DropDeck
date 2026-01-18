'use client';

/**
 * Error Message Components
 * Display error messages to users
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getErrorSeverity, getUserFriendlyMessage, isRetryableError } from '@/lib/errors';
import { useReducedMotion } from '@/lib/accessibility';
import { getAccessibleVariants, slideUpVariants } from '@/lib/animations/variants';

/**
 * Error severity types
 */
type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Props for ErrorMessage
 */
interface ErrorMessageProps {
  /** The error to display */
  error?: Error | null;
  /** Custom message override */
  message?: string;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Retry callback */
  onRetry?: () => void;
  /** Whether to show dismiss button */
  showDismiss?: boolean;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Children to render after message */
  children?: ReactNode;
}

/**
 * Severity configuration
 */
const severityConfig = {
  info: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    colors: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    colors: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  },
  error: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    colors: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
  },
  critical: {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    colors: 'bg-red-600/10 border-red-600/20 text-red-700 dark:text-red-500',
  },
};

/**
 * Map error severity to component severity
 */
function mapSeverity(error?: Error): ErrorSeverity {
  if (!error) return 'error';
  const severity = getErrorSeverity(error);
  switch (severity) {
    case 'low':
      return 'warning';
    case 'medium':
      return 'error';
    case 'high':
    case 'critical':
      return 'critical';
    default:
      return 'error';
  }
}

/**
 * ErrorMessage component
 * Displays an error message with optional retry/dismiss actions
 */
export const ErrorMessage = memo(function ErrorMessage({
  error,
  message,
  severity: severityProp,
  showRetry,
  onRetry,
  showDismiss,
  onDismiss,
  className,
  children,
}: ErrorMessageProps) {
  const reducedMotion = useReducedMotion();
  const variants = getAccessibleVariants(slideUpVariants, reducedMotion);

  // Determine severity
  const severity = severityProp ?? mapSeverity(error ?? undefined);
  const config = severityConfig[severity];

  // Determine message
  const displayMessage = message ?? (error ? getUserFriendlyMessage(error) : 'An error occurred');

  // Determine if retryable
  const canRetry = showRetry ?? (error ? isRetryableError(error) : false);

  return (
    <motion.div
      role="alert"
      aria-live={severity === 'critical' ? 'assertive' : 'polite'}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn('flex items-start gap-3 p-4 rounded-lg border', config.colors, className)}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{displayMessage}</p>
        {children}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {canRetry && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={cn(
              'text-sm font-medium px-3 py-1 rounded',
              'hover:bg-black/5 dark:hover:bg-white/5',
              'focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-1',
              'transition-colors'
            )}
          >
            Retry
          </button>
        )}
        {showDismiss && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              'p-1 rounded hover:bg-black/5 dark:hover:bg-white/5',
              'focus:outline-none focus:ring-2 focus:ring-current',
              'transition-colors'
            )}
            aria-label="Dismiss error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
});

/**
 * Inline error message for form fields
 */
export const InlineError = memo(function InlineError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p role="alert" className={cn('text-sm text-red-500 dark:text-red-400 mt-1', className)}>
      {message}
    </p>
  );
});

/**
 * Empty state with error styling
 */
export const ErrorEmptyState = memo(function ErrorEmptyState({
  title = 'Something went wrong',
  description = 'Please try again later.',
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        'text-[var(--dd-text-muted)]',
        className
      )}
    >
      {icon ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mb-4 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )}
      <h3 className="text-lg font-medium text-[var(--dd-text-primary)] mb-2">{title}</h3>
      <p className="text-sm mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  );
});

/**
 * Error list for validation errors
 */
export const ErrorList = memo(function ErrorList({
  errors,
  className,
}: {
  errors: Record<string, string[]>;
  className?: string;
}) {
  const errorEntries = Object.entries(errors).filter(([, messages]) => messages.length > 0);

  if (errorEntries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn('p-4 rounded-lg border bg-red-500/10 border-red-500/20', className)}
    >
      <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
        Please fix the following errors:
      </h4>
      <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
        {errorEntries.map(([field, messages]) =>
          messages.map((message, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Messages are static and won't reorder
            <li key={`${field}-${index}`}>
              <span className="font-medium">{field}:</span> {message}
            </li>
          ))
        )}
      </ul>
    </div>
  );
});

export default ErrorMessage;
