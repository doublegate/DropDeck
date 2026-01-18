/**
 * useRealTimeUpdates hook tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Ably before importing the hook
const mockChannel = {
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

const mockConnection = {
  on: vi.fn(),
  state: 'connected',
};

const mockClose = vi.fn();
const mockChannelsGet = vi.fn().mockReturnValue(mockChannel);

vi.mock('ably', () => {
  return {
    default: {
      Realtime: class MockRealtime {
        connection = mockConnection;
        channels = {
          get: mockChannelsGet,
        };
        close = mockClose;

        constructor() {
          // Mock constructor
        }
      },
    },
  };
});

import { useRealTimeUpdates, useLocationSubscription } from '@/hooks/use-realtime';

describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ABLY_API_KEY', 'test-api-key');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Initial State', () => {
    it('initializes with disconnected state when no userId', () => {
      const { result } = renderHook(() => useRealTimeUpdates());

      expect(result.current.connectionState).toBe('disconnected');
      expect(result.current.isConnected).toBe(false);
    });

    it('initializes with online status', () => {
      const { result } = renderHook(() => useRealTimeUpdates());

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('Connection Management', () => {
    it('does not connect when disabled', () => {
      const { result } = renderHook(() =>
        useRealTimeUpdates({
          userId: 'test-user',
          enabled: false,
        })
      );

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('does not connect without API key', () => {
      vi.stubEnv('NEXT_PUBLIC_ABLY_API_KEY', '');

      const { result } = renderHook(() =>
        useRealTimeUpdates({
          userId: 'test-user',
        })
      );

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('provides subscribe function', () => {
      const { result } = renderHook(() => useRealTimeUpdates());

      expect(typeof result.current.subscribe).toBe('function');
    });

    it('provides unsubscribe function', () => {
      const { result } = renderHook(() => useRealTimeUpdates());

      expect(typeof result.current.unsubscribe).toBe('function');
    });

    it('connects and subscribes when userId is provided', () => {
      const onStateChange = vi.fn();

      renderHook(() =>
        useRealTimeUpdates({
          userId: 'test-user',
          onStateChange,
        })
      );

      // The hook should transition to connecting state
      expect(onStateChange).toHaveBeenCalledWith('connecting');
    });
  });

  describe('Online/Offline Status', () => {
    it('updates isOnline on offline event', () => {
      const { result } = renderHook(() => useRealTimeUpdates());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('updates isOnline on online event', () => {
      const { result } = renderHook(() => useRealTimeUpdates());

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });
  });
});

describe('useLocationSubscription', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ABLY_API_KEY', 'test-api-key');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not subscribe without deliveryId', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useLocationSubscription(null, onUpdate));

    expect(result.current.isSubscribed).toBe(false);
  });

  it('does not subscribe without API key', () => {
    vi.stubEnv('NEXT_PUBLIC_ABLY_API_KEY', '');
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useLocationSubscription('delivery-123', onUpdate));

    expect(result.current.isSubscribed).toBe(false);
  });

  it('subscribes with valid deliveryId and API key', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useLocationSubscription('delivery-123', onUpdate));

    expect(result.current.isSubscribed).toBe(true);
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('unsubscribes when deliveryId changes to null', () => {
    const onUpdate = vi.fn();
    const { result, rerender } = renderHook(
      ({ deliveryId }) => useLocationSubscription(deliveryId, onUpdate),
      { initialProps: { deliveryId: 'delivery-123' as string | null } }
    );

    expect(result.current.isSubscribed).toBe(true);

    rerender({ deliveryId: null });

    expect(result.current.isSubscribed).toBe(false);
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });
});
