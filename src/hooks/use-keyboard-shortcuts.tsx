'use client';

/**
 * Keyboard Shortcuts Hook
 * Global and component-level keyboard shortcuts
 * Sprint 5.4 - Accessibility Features
 */

import { useEffect, useRef } from 'react';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Key to press (e.g., 'k', 'Enter', 'Escape') */
  key: string;
  /** Whether Ctrl/Cmd is required */
  ctrl?: boolean;
  /** Whether Shift is required */
  shift?: boolean;
  /** Whether Alt/Option is required */
  alt?: boolean;
  /** Whether Meta (Cmd on Mac, Win on Windows) is required */
  meta?: boolean;
  /** Handler function */
  handler: (event: KeyboardEvent) => void;
  /** Description for help display */
  description?: string;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
  /** Only trigger when no input is focused */
  ignoreInputs?: boolean;
}

/**
 * Check if user is on Mac
 */
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toLowerCase().includes('mac');
}

/**
 * Check if an input element is focused
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = activeElement.hasAttribute('contenteditable');

  return isInput || isContentEditable;
}

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // Check key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false;
  }

  // Check modifiers
  const ctrlOrMeta = isMac() ? event.metaKey : event.ctrlKey;

  if (shortcut.ctrl && !ctrlOrMeta) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  if (shortcut.meta && !event.metaKey) return false;

  // Check if we should ignore when input is focused
  if (shortcut.ignoreInputs && isInputFocused()) return false;

  return true;
}

/**
 * Hook for global keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }
          shortcut.handler(event);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

/**
 * Hook for a single keyboard shortcut
 */
export function useKeyboardShortcut(
  shortcut: Omit<KeyboardShortcut, 'handler'>,
  handler: (event: KeyboardEvent) => void
) {
  useKeyboardShortcuts([{ ...shortcut, handler }]);
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(handler: () => void) {
  useKeyboardShortcut({ key: 'Escape', description: 'Close' }, handler);
}

/**
 * Hook for enter key handling
 */
export function useEnterKey(handler: () => void, ignoreInputs = true) {
  useKeyboardShortcut({ key: 'Enter', ignoreInputs, description: 'Confirm' }, handler);
}

/**
 * Default app shortcuts
 */
export const AppShortcuts = {
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh deliveries' },
  SETTINGS: { key: ',', ctrl: true, description: 'Open settings' },
  HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  ESCAPE: { key: 'Escape', description: 'Close modal/panel' },
  NEXT: { key: 'j', ignoreInputs: true, description: 'Next delivery' },
  PREVIOUS: { key: 'k', ignoreInputs: true, description: 'Previous delivery' },
  SELECT: { key: 'Enter', ignoreInputs: true, description: 'Select delivery' },
  MAP_TOGGLE: { key: 'm', ignoreInputs: true, description: 'Toggle map view' },
} as const;

/**
 * Hook for app-level shortcuts
 */
export function useAppShortcuts(handlers: {
  onSearch?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSelect?: () => void;
  onMapToggle?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onSearch) {
    shortcuts.push({ ...AppShortcuts.SEARCH, handler: handlers.onSearch });
  }
  if (handlers.onRefresh) {
    shortcuts.push({ ...AppShortcuts.REFRESH, handler: handlers.onRefresh });
  }
  if (handlers.onSettings) {
    shortcuts.push({ ...AppShortcuts.SETTINGS, handler: handlers.onSettings });
  }
  if (handlers.onHelp) {
    shortcuts.push({ ...AppShortcuts.HELP, handler: handlers.onHelp });
  }
  if (handlers.onEscape) {
    shortcuts.push({ ...AppShortcuts.ESCAPE, handler: handlers.onEscape });
  }
  if (handlers.onNext) {
    shortcuts.push({ ...AppShortcuts.NEXT, handler: handlers.onNext });
  }
  if (handlers.onPrevious) {
    shortcuts.push({ ...AppShortcuts.PREVIOUS, handler: handlers.onPrevious });
  }
  if (handlers.onSelect) {
    shortcuts.push({ ...AppShortcuts.SELECT, handler: handlers.onSelect });
  }
  if (handlers.onMapToggle) {
    shortcuts.push({ ...AppShortcuts.MAP_TOGGLE, handler: handlers.onMapToggle });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Partial<KeyboardShortcut>): string {
  const parts: string[] = [];
  const mac = isMac();

  if (shortcut.ctrl) {
    parts.push(mac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(mac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(mac ? '⌥' : 'Alt');
  }
  if (shortcut.meta) {
    parts.push(mac ? '⌘' : 'Win');
  }

  if (shortcut.key) {
    const keyDisplay = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
    parts.push(keyDisplay);
  }

  return parts.join(mac ? '' : '+');
}

/**
 * Component to display shortcut hints
 */
export function ShortcutHint({ shortcut }: { shortcut: Partial<KeyboardShortcut> }) {
  const formatted = formatShortcut(shortcut);

  return (
    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-[var(--dd-bg-tertiary)] text-[var(--dd-text-muted)] rounded border border-[var(--dd-border)]">
      {formatted}
    </kbd>
  );
}
