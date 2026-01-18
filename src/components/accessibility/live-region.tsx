'use client';

/**
 * Live Region Component
 * ARIA live regions for screen reader announcements
 * Sprint 5.4 - Accessibility Features
 */

import { memo, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for LiveRegion
 */
/**
 * ARIA relevant attribute values
 */
type AriaRelevant =
  | 'additions'
  | 'removals'
  | 'text'
  | 'all'
  | 'additions text'
  | 'additions removals'
  | 'removals additions'
  | 'removals text'
  | 'text additions'
  | 'text removals';

/**
 * Props for LiveRegion
 */
interface LiveRegionProps {
  /** Content to announce */
  children?: ReactNode;
  /** Politeness setting */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether to announce the entire region or just changes */
  atomic?: boolean;
  /** Whether the region is currently busy (being updated) */
  busy?: boolean;
  /** Relevant changes to announce */
  relevant?: AriaRelevant;
  /** Additional CSS classes */
  className?: string;
  /** Whether to visually hide the region */
  visuallyHidden?: boolean;
}

/**
 * Visually hidden styles for screen reader only content
 */
const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * LiveRegion component
 * Creates an ARIA live region for dynamic content announcements
 */
export const LiveRegion = memo(function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  busy = false,
  relevant = 'additions text',
  className,
  visuallyHidden = true,
}: LiveRegionProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: div with role="status" is more flexible than output element
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-busy={busy}
      aria-relevant={relevant}
      className={cn(visuallyHidden && 'sr-only', className)}
      style={visuallyHidden ? visuallyHiddenStyles : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Alert component for important announcements
 */
export const Alert = memo(function Alert({
  children,
  className,
  visuallyHidden = false,
}: {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(visuallyHidden && 'sr-only', className)}
      style={visuallyHidden ? visuallyHiddenStyles : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Status component for non-urgent updates
 */
export const Status = memo(function Status({
  children,
  className,
  visuallyHidden = true,
}: {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: div with role="status" is more flexible than output element
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(visuallyHidden && 'sr-only', className)}
      style={visuallyHidden ? visuallyHiddenStyles : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Log component for sequential announcements
 */
export const Log = memo(function Log({
  children,
  className,
  visuallyHidden = true,
}: {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      className={cn(visuallyHidden && 'sr-only', className)}
      style={visuallyHidden ? visuallyHiddenStyles : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Timer component for time-based announcements
 */
export const Timer = memo(function Timer({
  children,
  className,
  visuallyHidden = true,
}: {
  children: ReactNode;
  className?: string;
  visuallyHidden?: boolean;
}) {
  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(visuallyHidden && 'sr-only', className)}
      style={visuallyHidden ? visuallyHiddenStyles : undefined}
    >
      {children}
    </div>
  );
});

/**
 * Hook for delayed announcements (prevents rapid-fire announcements)
 */
export function useDelayedAnnouncement(delay = 500) {
  const [message, setMessage] = useState<string | null>(null);
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (message === null) {
      setDisplayedMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedMessage(message);
    }, delay);

    return () => clearTimeout(timer);
  }, [message, delay]);

  return {
    message: displayedMessage,
    announce: setMessage,
    clear: () => setMessage(null),
  };
}

/**
 * Announcer component that batches updates
 */
export const Announcer = memo(function Announcer({
  messages,
  delay = 100,
}: {
  messages: string[];
  delay?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedMessage, setDisplayedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setDisplayedMessage(null);
      return;
    }

    if (currentIndex >= messages.length) {
      return;
    }

    const messageToDisplay = messages[currentIndex];
    const timer = setTimeout(() => {
      setDisplayedMessage(messageToDisplay ?? null);
      setCurrentIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [messages, currentIndex, delay]);

  // Reset when messages change - intentionally depend on messages array reference
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages dependency is intentional to reset on new messages
  useEffect(() => {
    setCurrentIndex(0);
  }, [messages]);

  return <LiveRegion>{displayedMessage}</LiveRegion>;
});

export default LiveRegion;
