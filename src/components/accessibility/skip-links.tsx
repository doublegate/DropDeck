'use client';

/**
 * Skip Links Component
 * Provides keyboard-accessible navigation for screen reader users
 * Sprint 5.4 - Accessibility Features
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Skip link target IDs
 */
export const SkipLinkTargets = {
  MAIN_CONTENT: 'main-content',
  NAVIGATION: 'main-navigation',
  DELIVERY_LIST: 'delivery-list',
  MAP: 'map-view',
  SEARCH: 'search-input',
} as const;

/**
 * Skip link item configuration
 */
interface SkipLinkItem {
  id: string;
  label: string;
}

/**
 * Props for SkipLinks
 */
interface SkipLinksProps {
  /** Custom skip link items */
  items?: SkipLinkItem[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default skip links
 */
const defaultSkipLinks: SkipLinkItem[] = [
  { id: SkipLinkTargets.MAIN_CONTENT, label: 'Skip to main content' },
  { id: SkipLinkTargets.NAVIGATION, label: 'Skip to navigation' },
];

/**
 * SkipLinks component
 * Renders visually hidden links that become visible on focus
 */
export const SkipLinks = memo(function SkipLinks({
  items = defaultSkipLinks,
  className,
}: SkipLinksProps) {
  return (
    <nav aria-label="Skip navigation" className={cn('fixed top-0 left-0 z-[9999]', className)}>
      <ul className="list-none m-0 p-0">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                // Visually hidden by default
                'absolute -left-[9999px] -top-[9999px]',
                'px-4 py-2 bg-brand-cyan text-white font-semibold',
                'no-underline rounded-br-lg',
                // Visible on focus
                'focus:left-0 focus:top-0',
                'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
                'transition-none'
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
});

/**
 * Skip link target wrapper
 * Use this to mark regions that skip links navigate to
 */
export const SkipLinkTarget = memo(function SkipLinkTarget({
  id,
  children,
  as: Component = 'div',
  className,
  ...props
}: {
  id: string;
  children: React.ReactNode;
  as?: 'div' | 'main' | 'section' | 'nav';
  className?: string;
  tabIndex?: number;
}) {
  return (
    <Component id={id} tabIndex={-1} className={cn('outline-none', className)} {...props}>
      {children}
    </Component>
  );
});

export default SkipLinks;
