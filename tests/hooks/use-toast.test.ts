/**
 * useToast hook tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('initializes with empty toasts array', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });

    it('provides toast function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.toast).toBe('function');
    });

    it('provides dismiss function', () => {
      const { result } = renderHook(() => useToast());

      expect(typeof result.current.dismiss).toBe('function');
    });
  });

  describe('Toast Management', () => {
    it('adds toast correctly', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'This is a test',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.title).toBe('Test Toast');
      expect(result.current.toasts[0]?.description).toBe('This is a test');
    });

    it('returns toast control functions', () => {
      const { result } = renderHook(() => useToast());

      let toastControl: ReturnType<typeof toast>;
      act(() => {
        toastControl = result.current.toast({
          title: 'Test Toast',
        });
      });

      expect(toastControl!.id).toBeDefined();
      expect(typeof toastControl!.dismiss).toBe('function');
      expect(typeof toastControl!.update).toBe('function');
    });

    it('dismisses toast by id', () => {
      const { result } = renderHook(() => useToast());

      let toastControl: ReturnType<typeof toast>;
      act(() => {
        toastControl = result.current.toast({
          title: 'Test Toast',
        });
      });

      expect(result.current.toasts[0]?.open).toBe(true);

      act(() => {
        result.current.dismiss(toastControl!.id);
      });

      expect(result.current.toasts[0]?.open).toBe(false);
    });

    it('dismisses all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts.every((t) => !t.open)).toBe(true);
    });

    it('limits toasts to TOAST_LIMIT (1)', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'First Toast' });
      });

      act(() => {
        result.current.toast({ title: 'Second Toast' });
      });

      // TOAST_LIMIT is 1, so only the most recent toast should be in the array
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.title).toBe('Second Toast');
    });
  });
});

describe('Toast Reducer', () => {
  const initialState = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('adds a toast to empty state', () => {
      const newToast = {
        id: '1',
        title: 'Test',
        open: true,
      };

      const result = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast,
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it('prepends new toast to existing toasts', () => {
      const existingToast = { id: '1', title: 'First', open: true };
      const newToast = { id: '2', title: 'Second', open: true };

      const result = reducer(
        { toasts: [existingToast] },
        { type: 'ADD_TOAST', toast: newToast }
      );

      expect(result.toasts[0]).toEqual(newToast);
    });
  });

  describe('UPDATE_TOAST', () => {
    it('updates existing toast', () => {
      const toast = { id: '1', title: 'Original', open: true };

      const result = reducer(
        { toasts: [toast] },
        { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } }
      );

      expect(result.toasts[0]?.title).toBe('Updated');
      expect(result.toasts[0]?.open).toBe(true);
    });

    it('does not update non-matching toast', () => {
      const toast = { id: '1', title: 'Original', open: true };

      const result = reducer(
        { toasts: [toast] },
        { type: 'UPDATE_TOAST', toast: { id: '2', title: 'Updated' } }
      );

      expect(result.toasts[0]?.title).toBe('Original');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('sets open to false for specific toast', () => {
      const toast = { id: '1', title: 'Test', open: true };

      const result = reducer(
        { toasts: [toast] },
        { type: 'DISMISS_TOAST', toastId: '1' }
      );

      expect(result.toasts[0]?.open).toBe(false);
    });

    it('sets open to false for all toasts when no id', () => {
      const toasts = [
        { id: '1', title: 'First', open: true },
        { id: '2', title: 'Second', open: true },
      ];

      const result = reducer(
        { toasts },
        { type: 'DISMISS_TOAST' }
      );

      expect(result.toasts.every((t) => !t.open)).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('removes specific toast', () => {
      const toasts = [
        { id: '1', title: 'First', open: true },
        { id: '2', title: 'Second', open: true },
      ];

      const result = reducer(
        { toasts },
        { type: 'REMOVE_TOAST', toastId: '1' }
      );

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]?.id).toBe('2');
    });

    it('removes all toasts when no id', () => {
      const toasts = [
        { id: '1', title: 'First', open: true },
        { id: '2', title: 'Second', open: true },
      ];

      const result = reducer(
        { toasts },
        { type: 'REMOVE_TOAST' }
      );

      expect(result.toasts).toHaveLength(0);
    });
  });
});
