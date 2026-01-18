'use client';

/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible to screen readers
 * Sprint 5.4 - Accessibility Features
 */

import { memo, type ReactNode, type ElementType } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for VisuallyHidden
 */
interface VisuallyHiddenProps {
  /** Content to hide visually */
  children: ReactNode;
  /** Element type to render */
  as?: ElementType;
  /** Whether the content should become visible on focus */
  focusable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * VisuallyHidden component
 * Renders content that is hidden from sighted users but accessible to screen readers
 */
export const VisuallyHidden = memo(function VisuallyHidden({
  children,
  as: Component = 'span',
  focusable = false,
  className,
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        // Standard visually hidden styles
        'absolute w-px h-px p-0 -m-px overflow-hidden',
        'whitespace-nowrap border-0',
        '[clip:rect(0,0,0,0)]',
        // Optionally become visible on focus
        focusable && [
          'focus:static focus:w-auto focus:h-auto',
          'focus:p-2 focus:m-0 focus:overflow-visible',
          'focus:whitespace-normal focus:clip-auto',
        ],
        className
      )}
      style={
        !focusable
          ? {
              position: 'absolute',
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }
          : undefined
      }
    >
      {children}
    </Component>
  );
});

/**
 * Screen reader only text
 * Shorthand for VisuallyHidden with span
 */
export const SrOnly = memo(function SrOnly({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn('sr-only', className)}
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
      }}
    >
      {children}
    </span>
  );
});

/**
 * Accessible icon wrapper
 * Adds screen reader text to icons
 */
export const AccessibleIcon = memo(function AccessibleIcon({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center', className)} aria-hidden="true">
      {children}
      <SrOnly>{label}</SrOnly>
    </span>
  );
});

/**
 * Decorative element wrapper
 * Marks content as decorative/presentational
 */
export const Decorative = memo(function Decorative({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true" role="presentation">
      {children}
    </span>
  );
});

export default VisuallyHidden;
