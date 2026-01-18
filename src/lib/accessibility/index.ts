/**
 * Accessibility utilities for DropDeck
 * Sprint 5.4 - Accessibility Features
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keyboard key codes for navigation
 */
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook for keyboard navigation within a container
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: number,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<T>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (items === 0) return;

      let newIndex = activeIndex;
      const isVertical = orientation === 'vertical' || orientation === 'both';
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';

      switch (event.key) {
        case Keys.ARROW_DOWN:
          if (isVertical) {
            event.preventDefault();
            newIndex = loop ? (activeIndex + 1) % items : Math.min(activeIndex + 1, items - 1);
          }
          break;
        case Keys.ARROW_UP:
          if (isVertical) {
            event.preventDefault();
            newIndex = loop ? (activeIndex - 1 + items) % items : Math.max(activeIndex - 1, 0);
          }
          break;
        case Keys.ARROW_RIGHT:
          if (isHorizontal) {
            event.preventDefault();
            newIndex = loop ? (activeIndex + 1) % items : Math.min(activeIndex + 1, items - 1);
          }
          break;
        case Keys.ARROW_LEFT:
          if (isHorizontal) {
            event.preventDefault();
            newIndex = loop ? (activeIndex - 1 + items) % items : Math.max(activeIndex - 1, 0);
          }
          break;
        case Keys.HOME:
          event.preventDefault();
          newIndex = 0;
          break;
        case Keys.END:
          event.preventDefault();
          newIndex = items - 1;
          break;
        case Keys.ENTER:
        case Keys.SPACE:
          event.preventDefault();
          onSelect?.(activeIndex);
          return;
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    },
    [activeIndex, items, orientation, loop, onSelect]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
    activeIndex,
    setActiveIndex,
  };
}

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap<T extends HTMLElement>(active = true) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement;

    // Get focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== Keys.TAB) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [active]);

  return containerRef;
}

/**
 * Hook for managing focus on mount
 */
export function useFocusOnMount<T extends HTMLElement>(autoFocus = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  return ref;
}

/**
 * Generate unique IDs for ARIA attributes
 */
let idCounter = 0;
export function generateId(prefix = 'dd'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Hook for generating unique IDs
 */
export function useId(prefix = 'dd'): string {
  const [id] = useState(() => generateId(prefix));
  return id;
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;

  // Find or create announcer element
  let announcer = document.getElementById('dd-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'dd-announcer';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  // Update aria-live based on priority
  announcer.setAttribute('aria-live', priority);

  // Clear and set message (required for some screen readers)
  announcer.textContent = '';
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 100);
}

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  return {
    announce,
    announcePolite: (message: string) => announce(message, 'polite'),
    announceAssertive: (message: string) => announce(message, 'assertive'),
  };
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  );
  return Array.from(elements).filter(isElementVisible);
}

/**
 * Move focus to first focusable element in container
 */
export function focusFirstElement(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  if (elements.length > 0) {
    elements[0]?.focus();
  }
}

/**
 * ARIA role types
 */
export type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

/**
 * ARIA attributes helper
 */
export interface AriaAttributes {
  role?: AriaRole;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-pressed'?: boolean | 'mixed';
  'aria-checked'?: boolean | 'mixed';
  'aria-selected'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-modal'?: boolean;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-level'?: number;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
}

/**
 * Create ARIA props for a button
 */
export function getButtonAriaProps(options: {
  label: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  haspopup?: boolean | 'menu' | 'listbox' | 'dialog';
  disabled?: boolean;
}): AriaAttributes {
  const props: AriaAttributes = {
    'aria-label': options.label,
  };

  if (options.pressed !== undefined) {
    props['aria-pressed'] = options.pressed;
  }
  if (options.expanded !== undefined) {
    props['aria-expanded'] = options.expanded;
  }
  if (options.controls) {
    props['aria-controls'] = options.controls;
  }
  if (options.haspopup) {
    props['aria-haspopup'] = options.haspopup;
  }
  if (options.disabled) {
    props['aria-disabled'] = true;
  }

  return props;
}

/**
 * Create ARIA props for a dialog
 */
export function getDialogAriaProps(options: {
  labelledby?: string;
  describedby?: string;
  modal?: boolean;
}): AriaAttributes {
  return {
    role: 'dialog',
    'aria-modal': options.modal ?? true,
    ...(options.labelledby && { 'aria-labelledby': options.labelledby }),
    ...(options.describedby && { 'aria-describedby': options.describedby }),
  };
}

/**
 * Create ARIA props for a progress indicator
 */
export function getProgressAriaProps(options: {
  label: string;
  min?: number;
  max?: number;
  value?: number;
  valueText?: string;
}): AriaAttributes {
  return {
    role: 'progressbar',
    'aria-label': options.label,
    'aria-valuemin': options.min ?? 0,
    'aria-valuemax': options.max ?? 100,
    ...(options.value !== undefined && { 'aria-valuenow': options.value }),
    ...(options.valueText && { 'aria-valuetext': options.valueText }),
  };
}

/**
 * Create ARIA props for a list
 */
export function getListAriaProps(options: {
  label?: string;
  labelledby?: string;
  orientation?: 'horizontal' | 'vertical';
}): AriaAttributes {
  return {
    role: 'list',
    ...(options.label && { 'aria-label': options.label }),
    ...(options.labelledby && { 'aria-labelledby': options.labelledby }),
  };
}

/**
 * Create ARIA props for a list item
 */
export function getListItemAriaProps(options: {
  index: number;
  total: number;
  selected?: boolean;
}): AriaAttributes {
  return {
    role: 'listitem',
    'aria-setsize': options.total,
    'aria-posinset': options.index + 1,
    ...(options.selected !== undefined && { 'aria-selected': options.selected }),
  };
}
