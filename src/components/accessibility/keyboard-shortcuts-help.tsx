'use client';

/**
 * Keyboard Shortcuts Help Dialog
 * Displays available keyboard shortcuts
 * Sprint 5.4 - Accessibility Features
 */

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { AppShortcuts, formatShortcut } from '@/hooks/use-keyboard-shortcuts';
import { useReducedMotion } from '@/lib/accessibility';
import { getAccessibleVariants, scaleVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import { FocusTrap } from './focus-trap';

/**
 * Props for KeyboardShortcutsHelp
 */
interface KeyboardShortcutsHelpProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
}

/**
 * Shortcut group definition
 */
interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: Parameters<typeof formatShortcut>[0];
    description: string;
  }>;
}

/**
 * Organized shortcut groups
 */
const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: AppShortcuts.NEXT, description: 'Next delivery' },
      { keys: AppShortcuts.PREVIOUS, description: 'Previous delivery' },
      { keys: AppShortcuts.SELECT, description: 'Select delivery' },
      { keys: AppShortcuts.MAP_TOGGLE, description: 'Toggle map view' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: AppShortcuts.SEARCH, description: 'Open search' },
      { keys: AppShortcuts.REFRESH, description: 'Refresh deliveries' },
      { keys: AppShortcuts.SETTINGS, description: 'Open settings' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: AppShortcuts.HELP, description: 'Show this help' },
      { keys: AppShortcuts.ESCAPE, description: 'Close dialog/panel' },
    ],
  },
];

/**
 * Single shortcut row
 */
const ShortcutRow = memo(function ShortcutRow({
  keys,
  description,
}: {
  keys: Parameters<typeof formatShortcut>[0];
  description: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[var(--dd-text-secondary)]">{description}</span>
      <kbd className="inline-flex items-center gap-1 px-2 py-1 text-sm font-mono bg-[var(--dd-bg-tertiary)] text-[var(--dd-text-primary)] rounded border border-[var(--dd-border)]">
        {formatShortcut(keys)}
      </kbd>
    </div>
  );
});

/**
 * KeyboardShortcutsHelp component
 * Modal dialog showing all available keyboard shortcuts
 */
export const KeyboardShortcutsHelp = memo(function KeyboardShortcutsHelp({
  open,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const reducedMotion = useReducedMotion();
  const variants = getAccessibleVariants(scaleVariants, reducedMotion);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <FocusTrap active={open}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                'w-full max-w-md max-h-[80vh] overflow-y-auto',
                'bg-[var(--dd-bg-primary)] rounded-xl shadow-2xl',
                'border border-[var(--dd-border)]'
              )}
            >
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--dd-border)] bg-[var(--dd-bg-primary)]">
                <h2
                  id="keyboard-shortcuts-title"
                  className="text-lg font-semibold text-[var(--dd-text-primary)]"
                >
                  Keyboard Shortcuts
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-lg text-[var(--dd-text-muted)]',
                    'hover:bg-[var(--dd-bg-secondary)] hover:text-[var(--dd-text-primary)]',
                    'focus:outline-none focus:ring-2 focus:ring-brand-cyan',
                    'transition-colors'
                  )}
                  aria-label="Close keyboard shortcuts"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-6">
                {shortcutGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-medium text-[var(--dd-text-muted)] uppercase tracking-wider mb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-1">
                      {group.shortcuts.map((shortcut) => (
                        <ShortcutRow
                          key={shortcut.description}
                          keys={shortcut.keys}
                          description={shortcut.description}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 p-4 border-t border-[var(--dd-border)] bg-[var(--dd-bg-primary)]">
                <p className="text-xs text-[var(--dd-text-muted)] text-center">
                  Press{' '}
                  <kbd className="px-1 py-0.5 text-xs bg-[var(--dd-bg-tertiary)] rounded">
                    Escape
                  </kbd>{' '}
                  to close
                </p>
              </div>
            </motion.div>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>
  );
});

export default KeyboardShortcutsHelp;
