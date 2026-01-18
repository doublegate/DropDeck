/**
 * Online status hook tests
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus, useOnOnline, useOnOffline } from '@/hooks/use-online-status';

describe('useOnlineStatus', () => {
  let listeners: Map<string, EventListener>;

  beforeEach(() => {
    listeners = new Map();

    // Mock navigator.onLine
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        onLine: true,
        connection: {
          type: 'wifi',
          effectiveType: '4g',
          saveData: false,
          downlink: 10,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    // Mock event listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
      listeners.set(type, listener as EventListener);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((type) => {
      listeners.delete(type);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial online status', () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isJustChanged).toBe(false);
  });

  it('returns connection info when available', () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.connectionType).toBe('wifi');
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.isSlowConnection).toBe(false);
  });

  it('detects slow connection', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...window.navigator,
        onLine: true,
        connection: {
          type: 'cellular',
          effectiveType: '2g',
          saveData: false,
          downlink: 0.2,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isSlowConnection).toBe(true);
  });

  it('updates when going offline', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.isOnline).toBe(true);

    // Trigger offline event
    act(() => {
      const offlineListener = listeners.get('offline');
      if (offlineListener) {
        offlineListener(new Event('offline'));
      }
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isJustChanged).toBe(true);
  });

  it('updates when going online', () => {
    // Start offline
    Object.defineProperty(window.navigator, 'onLine', { value: false });

    const { result } = renderHook(() => useOnlineStatus());

    // Trigger online event
    act(() => {
      const onlineListener = listeners.get('online');
      if (onlineListener) {
        onlineListener(new Event('online'));
      }
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isJustChanged).toBe(true);
  });

  it('tracks time since status change', () => {
    const { result } = renderHook(() => useOnlineStatus());

    // Initially null
    expect(result.current.timeSinceChange).toBeNull();

    // Trigger offline
    act(() => {
      const offlineListener = listeners.get('offline');
      if (offlineListener) {
        offlineListener(new Event('offline'));
      }
    });

    // Should have a time value now
    expect(result.current.timeSinceChange).toBeGreaterThanOrEqual(0);
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('handles missing connection API gracefully', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        onLine: true,
        // No connection property
      },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current.connectionType).toBeNull();
    expect(result.current.effectiveType).toBeNull();
    expect(result.current.isSlowConnection).toBe(false);
  });
});

describe('useOnOnline', () => {
  it('does not call callback when already online', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });

    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

    const callback = vi.fn();

    renderHook(() => useOnOnline(callback));

    // Should not be called initially when already online
    expect(callback).not.toHaveBeenCalled();
  });

  it('provides the hook without errors', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    });

    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

    const callback = vi.fn();

    // Should not throw
    expect(() => renderHook(() => useOnOnline(callback))).not.toThrow();
  });
});

describe('useOnOffline', () => {
  it('does not call callback when already offline', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    });

    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

    const callback = vi.fn();

    renderHook(() => useOnOffline(callback));

    // Should not be called initially when already offline
    expect(callback).not.toHaveBeenCalled();
  });

  it('provides the hook without errors', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });

    vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

    const callback = vi.fn();

    // Should not throw
    expect(() => renderHook(() => useOnOffline(callback))).not.toThrow();
  });
});
