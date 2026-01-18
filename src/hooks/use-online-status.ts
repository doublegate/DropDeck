'use client';

/**
 * Online Status Hook
 * Detect and track online/offline status
 * Sprint 5.5 - Error Handling and Offline Support
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Online status result
 */
export interface OnlineStatus {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether the status was just changed (for animations) */
  isJustChanged: boolean;
  /** Time since status changed */
  timeSinceChange: number | null;
  /** Connection type if available */
  connectionType: string | null;
  /** Effective connection type if available */
  effectiveType: string | null;
  /** Whether connection is slow */
  isSlowConnection: boolean;
}

/**
 * Navigator connection interface
 */
interface NavigatorConnection {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
}

/**
 * Get navigator connection info
 */
function getConnectionInfo(): Pick<
  OnlineStatus,
  'connectionType' | 'effectiveType' | 'isSlowConnection'
> {
  if (typeof navigator === 'undefined') {
    return {
      connectionType: null,
      effectiveType: null,
      isSlowConnection: false,
    };
  }

  const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection;

  if (!connection) {
    return {
      connectionType: null,
      effectiveType: null,
      isSlowConnection: false,
    };
  }

  const isSlowConnection =
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData === true ||
    (connection.downlink !== undefined && connection.downlink < 0.5);

  return {
    connectionType: connection.type ?? null,
    effectiveType: connection.effectiveType ?? null,
    isSlowConnection,
  };
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });
  const [isJustChanged, setIsJustChanged] = useState(false);
  const [lastChangeTime, setLastChangeTime] = useState<number | null>(null);
  const [connectionInfo, setConnectionInfo] = useState(() => getConnectionInfo());

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setIsJustChanged(true);
    setLastChangeTime(Date.now());
    setConnectionInfo(getConnectionInfo());

    // Reset "just changed" after animation
    setTimeout(() => setIsJustChanged(false), 3000);
  }, []);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setIsJustChanged(true);
    setLastChangeTime(Date.now());

    // Reset "just changed" after animation
    setTimeout(() => setIsJustChanged(false), 3000);
  }, []);

  // Handle connection change
  const handleConnectionChange = useCallback(() => {
    setConnectionInfo(getConnectionInfo());
  }, []);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setConnectionInfo(getConnectionInfo());

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add connection change listener if available
    const connection = (navigator as Navigator & { connection?: NavigatorConnection & EventTarget })
      .connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange]);

  // Calculate time since change
  const timeSinceChange = lastChangeTime ? Date.now() - lastChangeTime : null;

  return {
    isOnline,
    isJustChanged,
    timeSinceChange,
    ...connectionInfo,
  };
}

/**
 * Hook to run callback when going online
 */
export function useOnOnline(callback: () => void): void {
  const { isOnline } = useOnlineStatus();
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    if (isOnline && !prevOnlineRef.current) {
      callback();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, callback]);
}

/**
 * Hook to run callback when going offline
 */
export function useOnOffline(callback: () => void): void {
  const { isOnline } = useOnlineStatus();
  const prevOnlineRef = useRef(isOnline);

  useEffect(() => {
    if (!isOnline && prevOnlineRef.current) {
      callback();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, callback]);
}

export default useOnlineStatus;
