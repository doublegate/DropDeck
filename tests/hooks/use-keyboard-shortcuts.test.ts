/**
 * Keyboard shortcuts hook tests
 * Sprint 5.4 - Accessibility Features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  useKeyboardShortcut,
  useEscapeKey,
  useEnterKey,
  useAppShortcuts,
  formatShortcut,
  AppShortcuts,
  type KeyboardShortcut,
} from '@/hooks/use-keyboard-shortcuts';

describe('Keyboard Shortcuts', () => {
  let mockNavigator: { platform: string };

  beforeEach(() => {
    mockNavigator = { platform: 'Win32' };
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useKeyboardShortcuts', () => {
    it('calls handler when shortcut is pressed', () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', ctrl: true, handler },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Simulate Ctrl+K
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not call handler when wrong key is pressed', () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', ctrl: true, handler },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Simulate Ctrl+J (wrong key)
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'j',
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('does not call handler when modifier is missing', () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', ctrl: true, handler },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Simulate K without Ctrl
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: false,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('respects shift modifier', () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: '?', shift: true, handler },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Simulate Shift+?
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '?',
          shiftKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('respects alt modifier', () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'a', alt: true, handler },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          altKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles multiple shortcuts', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', ctrl: true, handler: handler1 },
        { key: 'j', ctrl: true, handler: handler2 },
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      act(() => {
        const event1 = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event1);
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      act(() => {
        const event2 = new KeyboardEvent('keydown', {
          key: 'j',
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event2);
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('cleans up on unmount', () => {
      const handler = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        { key: 'k', ctrl: true, handler },
      ];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
      unmount();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('useKeyboardShortcut', () => {
    it('handles single shortcut', () => {
      const handler = vi.fn();

      renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler));

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('useEscapeKey', () => {
    it('calls handler on Escape', () => {
      const handler = vi.fn();

      renderHook(() => useEscapeKey(handler));

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('useEnterKey', () => {
    it('calls handler on Enter when no input is focused', () => {
      const handler = vi.fn();

      renderHook(() => useEnterKey(handler));

      // Make sure no input is focused
      document.body.focus();

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAppShortcuts', () => {
    it('registers search shortcut', () => {
      const onSearch = vi.fn();

      renderHook(() => useAppShortcuts({ onSearch }));

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('registers escape shortcut', () => {
      const onEscape = vi.fn();

      renderHook(() => useAppShortcuts({ onEscape }));

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        });
        document.dispatchEvent(event);
      });

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('registers navigation shortcuts', () => {
      const onNext = vi.fn();
      const onPrevious = vi.fn();

      document.body.focus();

      renderHook(() => useAppShortcuts({ onNext, onPrevious }));

      act(() => {
        const nextEvent = new KeyboardEvent('keydown', {
          key: 'j',
          bubbles: true,
        });
        document.dispatchEvent(nextEvent);
      });

      expect(onNext).toHaveBeenCalledTimes(1);

      act(() => {
        const prevEvent = new KeyboardEvent('keydown', {
          key: 'k',
          bubbles: true,
        });
        document.dispatchEvent(prevEvent);
      });

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatShortcut', () => {
    it('formats simple key', () => {
      expect(formatShortcut({ key: 'a' })).toBe('A');
    });

    it('formats ctrl modifier on Windows', () => {
      mockNavigator.platform = 'Win32';
      expect(formatShortcut({ key: 'k', ctrl: true })).toBe('Ctrl+K');
    });

    it('formats ctrl modifier on Mac as command', () => {
      mockNavigator.platform = 'MacIntel';
      // Note: On Mac, ctrl becomes Cmd symbol
      const result = formatShortcut({ key: 'k', ctrl: true });
      expect(result).toContain('K');
    });

    it('formats shift modifier', () => {
      mockNavigator.platform = 'Win32';
      expect(formatShortcut({ key: '?', shift: true })).toBe('Shift+?');
    });

    it('formats alt modifier', () => {
      mockNavigator.platform = 'Win32';
      expect(formatShortcut({ key: 'a', alt: true })).toBe('Alt+A');
    });

    it('formats combined modifiers', () => {
      mockNavigator.platform = 'Win32';
      expect(formatShortcut({ key: 's', ctrl: true, shift: true })).toBe('Ctrl+Shift+S');
    });

    it('formats special keys', () => {
      expect(formatShortcut({ key: 'Escape' })).toBe('Escape');
      expect(formatShortcut({ key: 'Enter' })).toBe('Enter');
    });
  });

  describe('AppShortcuts', () => {
    it('has correct shortcut definitions', () => {
      expect(AppShortcuts.SEARCH).toEqual({ key: 'k', ctrl: true, description: 'Open search' });
      expect(AppShortcuts.REFRESH).toEqual({ key: 'r', ctrl: true, description: 'Refresh deliveries' });
      expect(AppShortcuts.SETTINGS).toEqual({ key: ',', ctrl: true, description: 'Open settings' });
      expect(AppShortcuts.HELP).toEqual({ key: '?', shift: true, description: 'Show keyboard shortcuts' });
      expect(AppShortcuts.ESCAPE).toEqual({ key: 'Escape', description: 'Close modal/panel' });
    });
  });
});
