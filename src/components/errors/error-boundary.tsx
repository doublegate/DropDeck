'use client';

/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError, getUserFriendlyMessage, getErrorSeverity } from '@/lib/errors';
import { cn } from '@/lib/utils';

/**
 * Props for ErrorBoundary
 */
interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Fallback UI to render on error */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details (development mode) */
  showDetails?: boolean;
  /** Whether to allow reset */
  allowReset?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * State for ErrorBoundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logError(error, {
      componentStack: errorInfo.componentStack,
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails, allowReset = true, className } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError);
        }
        return fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          showDetails={showDetails ?? process.env.NODE_ENV === 'development'}
          allowReset={allowReset}
          onReset={this.resetError}
          className={className}
        />
      );
    }

    return children;
  }
}

/**
 * Default error fallback component
 */
function ErrorFallback({
  error,
  errorInfo,
  showDetails,
  allowReset,
  onReset,
  className,
}: {
  error: Error;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  allowReset: boolean;
  onReset: () => void;
  className?: string;
}) {
  const severity = getErrorSeverity(error);
  const friendlyMessage = getUserFriendlyMessage(error);

  const severityColors = {
    low: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
    medium: 'bg-orange-500/10 border-orange-500/20 text-orange-600',
    high: 'bg-red-500/10 border-red-500/20 text-red-600',
    critical: 'bg-red-600/10 border-red-600/20 text-red-700',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center justify-center min-h-[200px] p-6 rounded-lg border',
        severityColors[severity],
        className
      )}
    >
      {/* Error icon */}
      <div className="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
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
      </div>

      {/* Error message */}
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm opacity-80 text-center max-w-md mb-4">{friendlyMessage}</p>

      {/* Actions */}
      <div className="flex gap-3">
        {allowReset && (
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm',
              'bg-[var(--dd-bg-primary)] border border-[var(--dd-border)]',
              'hover:bg-[var(--dd-bg-secondary)] transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-cyan'
            )}
          >
            Try Again
          </button>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={cn(
            'px-4 py-2 rounded-lg font-medium text-sm',
            'bg-brand-cyan text-white',
            'hover:bg-brand-cyan/90 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2'
          )}
        >
          Reload Page
        </button>
      </div>

      {/* Error details (development only) */}
      {showDetails && (
        <details className="mt-6 w-full max-w-2xl">
          <summary className="cursor-pointer text-sm opacity-60 hover:opacity-80">
            Show error details
          </summary>
          <div className="mt-2 p-4 bg-[var(--dd-bg-primary)] rounded-lg border border-[var(--dd-border)] overflow-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              <strong>{error.name}:</strong> {error.message}
              {'\n\n'}
              <strong>Stack:</strong>
              {'\n'}
              {error.stack}
              {errorInfo?.componentStack && (
                <>
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {'\n'}
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
