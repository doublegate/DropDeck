/**
 * useNotifications hook tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications, useNotificationPreferences } from '@/hooks/use-notifications';

// Mock Ably before importing the hook
vi.mock('ably', () => ({
  default: {
    Realtime: vi.fn().mockImplementation(() => ({
      connection: {
        on: vi.fn(),
        state: 'connected',
      },
      channels: {
        get: vi.fn().mockReturnValue({
          subscribe: vi.fn(),
          unsubscribe: vi.fn(),
          publish: vi.fn(),
        }),
      },
      close: vi.fn(),
    })),
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ABLY_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Initial State', () => {
    it('initializes with empty notifications', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('initializes as not connected without userId', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Notification Management', () => {
    it('adds notification correctly', () => {
      const { result } = renderHook(() => useNotifications());

      const notification = {
        id: 'test-1',
        type: 'status_update',
        title: 'Order Update',
        body: 'Your order is out for delivery',
        read: false,
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNotification(notification);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]?.id).toBe('test-1');
      expect(result.current.unreadCount).toBe(1);
    });

    it('limits notifications to 50', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        for (let i = 0; i < 60; i++) {
          result.current.addNotification({
            id: `test-${i}`,
            type: 'status_update',
            title: 'Order Update',
            body: 'Test notification',
            read: false,
            createdAt: new Date(),
          });
        }
      });

      expect(result.current.notifications).toHaveLength(50);
    });

    it('adds new notifications at the beginning', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: 'first',
          type: 'status_update',
          title: 'First',
          body: 'First notification',
          read: false,
          createdAt: new Date(),
        });
      });

      act(() => {
        result.current.addNotification({
          id: 'second',
          type: 'status_update',
          title: 'Second',
          body: 'Second notification',
          read: false,
          createdAt: new Date(),
        });
      });

      expect(result.current.notifications[0]?.id).toBe('second');
      expect(result.current.notifications[1]?.id).toBe('first');
    });
  });

  describe('Mark as Read', () => {
    it('marks single notification as read', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: 'test-1',
          type: 'status_update',
          title: 'Test',
          body: 'Test notification',
          read: false,
          createdAt: new Date(),
        });
      });

      expect(result.current.unreadCount).toBe(1);

      act(() => {
        result.current.markAsRead('test-1');
      });

      expect(result.current.notifications[0]?.read).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('marks all notifications as read', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: 'test-1',
          type: 'status_update',
          title: 'Test 1',
          body: 'Test',
          read: false,
          createdAt: new Date(),
        });
        result.current.addNotification({
          id: 'test-2',
          type: 'status_update',
          title: 'Test 2',
          body: 'Test',
          read: false,
          createdAt: new Date(),
        });
      });

      expect(result.current.unreadCount).toBe(2);

      act(() => {
        result.current.markAllAsRead();
      });

      expect(result.current.notifications.every((n) => n.read)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });

    it('does not decrease unread count below 0', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.markAsRead('non-existent');
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Clear All', () => {
    it('clears all notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.addNotification({
          id: 'test-1',
          type: 'status_update',
          title: 'Test',
          body: 'Test',
          read: false,
          createdAt: new Date(),
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.notifications).toHaveLength(0);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Callback', () => {
    it('calls onNotification callback when notification is added', () => {
      const onNotification = vi.fn();
      const { result } = renderHook(() => useNotifications({ onNotification }));

      const notification = {
        id: 'test-1',
        type: 'status_update',
        title: 'Test',
        body: 'Test',
        read: false,
        createdAt: new Date(),
      };

      act(() => {
        result.current.addNotification(notification);
      });

      expect(onNotification).toHaveBeenCalledWith(notification);
    });
  });
});

describe('useNotificationPreferences', () => {
  it('initializes with default preferences', () => {
    const { result } = renderHook(() => useNotificationPreferences());

    expect(result.current.preferences.pushEnabled).toBe(true);
    expect(result.current.preferences.inAppEnabled).toBe(true);
    expect(result.current.preferences.soundEnabled).toBe(true);
    expect(result.current.preferences.driverAssigned).toBe(true);
    expect(result.current.preferences.outForDelivery).toBe(true);
    expect(result.current.preferences.arrivingSoon).toBe(true);
    expect(result.current.preferences.delivered).toBe(true);
    expect(result.current.preferences.delayed).toBe(true);
    expect(result.current.preferences.quietHoursEnabled).toBe(false);
  });

  it('updates a preference', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await act(async () => {
      await result.current.updatePreference('pushEnabled', false);
    });

    expect(result.current.preferences.pushEnabled).toBe(false);
  });

  it('updates quiet hours preferences', async () => {
    const { result } = renderHook(() => useNotificationPreferences());

    await act(async () => {
      await result.current.updatePreference('quietHoursEnabled', true);
      await result.current.updatePreference('quietHoursStart', '23:00');
      await result.current.updatePreference('quietHoursEnd', '07:00');
    });

    expect(result.current.preferences.quietHoursEnabled).toBe(true);
    expect(result.current.preferences.quietHoursStart).toBe('23:00');
    expect(result.current.preferences.quietHoursEnd).toBe('07:00');
  });
});
