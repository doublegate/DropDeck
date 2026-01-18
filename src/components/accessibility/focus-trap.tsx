'use client';

/**
 * Focus Trap Component
 * Traps focus within a container for modals and dialogs
 * Sprint 5.4 - Accessibility Features
 */

import { memo, useRef, useEffect, type ReactNode } from 'react';
import { useFocusTrap } from '@/lib/accessibility';

/**
 * Props for FocusTrap
 */
interface FocusTrapProps {
  /** Children to render inside the trap */
  children: ReactNode;
  /** Whether the trap is active */
  active?: boolean;
  /** Whether to auto-focus the first element */
  autoFocus?: boolean;
  /** Whether to restore focus when deactivated */
  restoreFocus?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Element to focus initially (selector or ref) */
  initialFocus?: string | React.RefObject<HTMLElement>;
}

/**
 * FocusTrap component
 * Wraps content and traps keyboard focus within
 */
export const FocusTrap = memo(function FocusTrap({
  children,
  active = true,
  autoFocus = true,
  restoreFocus = true,
  className,
  initialFocus,
}: FocusTrapProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(active);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: containerRef.current is a mutable ref, not a reactive dependency
  useEffect(() => {
    if (!active) return;

    // Store previously focused element
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Focus initial element - get reference at effect time
    const container = containerRef.current;
    if (autoFocus && container) {
      let elementToFocus: HTMLElement | null = null;

      if (initialFocus) {
        if (typeof initialFocus === 'string') {
          elementToFocus = container.querySelector(initialFocus);
        } else if (initialFocus.current) {
          elementToFocus = initialFocus.current;
        }
      }

      if (!elementToFocus) {
        // Default to first focusable element
        const focusable = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          elementToFocus = focusable[0] ?? null;
        }
      }

      if (elementToFocus) {
        // Small delay to ensure the element is rendered
        requestAnimationFrame(() => {
          elementToFocus?.focus();
        });
      }
    }

    return () => {
      // Restore focus when trap is deactivated
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, autoFocus, restoreFocus, initialFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
});

/**
 * Sentinel element for focus trap boundaries
 */
export const FocusSentinel = memo(function FocusSentinel({ onFocus }: { onFocus: () => void }) {
  return (
    <button
      type="button"
      tabIndex={0}
      onFocus={onFocus}
      aria-label="Focus trap boundary"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
        background: 'none',
      }}
    />
  );
});

export default FocusTrap;
