/**
 * Performance utilities for DropDeck
 * Sprint 5.3 - Performance Optimizations
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for measuring component render performance
 */
export function useRenderMetrics(componentName: string, enabled = false) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCountRef.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    lastRenderTimeRef.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.debug(
        `[Performance] ${componentName} rendered`,
        `(#${renderCountRef.current}, ${timeSinceLastRender.toFixed(2)}ms since last)`
      );
    }
  });

  return {
    renderCount: renderCountRef.current,
    resetCount: () => {
      renderCountRef.current = 0;
    },
  };
}

/**
 * Debounce hook for expensive operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for frequent updates
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(
      () => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      },
      limit - (Date.now() - lastRan.current)
    );

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        callback(entry.isIntersecting);
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
}

/**
 * Create a stable callback that doesn't trigger re-renders
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  keyFn?: (...args: Args) => string
): (...args: Args) => Result {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  };
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1) as unknown as number;
}

/**
 * Cancel idle callback wrapper
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

/**
 * Batch DOM updates using requestAnimationFrame
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    // Create a document fragment for batch updates
    for (const update of updates) {
      update();
    }
  });
}

/**
 * Performance timing helper
 */
export function measureTime<T>(label: string, fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Async performance timing helper
 */
export async function measureTimeAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Web Vitals reporter
 */
export interface WebVitals {
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  FID?: number; // First Input Delay
  LCP?: number; // Largest Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

type WebVitalsCallback = (metrics: WebVitals) => void;

const vitalsCallbacks: WebVitalsCallback[] = [];
const collectedVitals: WebVitals = {};

/**
 * Register a callback for web vitals
 */
export function onWebVitals(callback: WebVitalsCallback): () => void {
  vitalsCallbacks.push(callback);

  // If vitals already collected, call immediately
  if (Object.keys(collectedVitals).length > 0) {
    callback(collectedVitals);
  }

  return () => {
    const index = vitalsCallbacks.indexOf(callback);
    if (index > -1) {
      vitalsCallbacks.splice(index, 1);
    }
  };
}

/**
 * Report a web vital metric
 */
export function reportVital(name: keyof WebVitals, value: number): void {
  collectedVitals[name] = value;

  vitalsCallbacks.forEach((callback) => {
    callback(collectedVitals);
  });
}

/**
 * Initialize web vitals collection
 * Call this in your app entry point
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Use dynamic import for web-vitals library
  // Note: Install web-vitals package for this to work: bun add web-vitals
  // @ts-expect-error - web-vitals is an optional dependency
  import('web-vitals')
    .then(
      (webVitals: {
        onCLS: (cb: (metric: { value: number }) => void) => void;
        onFCP: (cb: (metric: { value: number }) => void) => void;
        onLCP: (cb: (metric: { value: number }) => void) => void;
        onTTFB: (cb: (metric: { value: number }) => void) => void;
        onINP?: (cb: (metric: { value: number }) => void) => void;
      }) => {
        webVitals.onCLS((metric) => reportVital('CLS', metric.value));
        webVitals.onFCP((metric) => reportVital('FCP', metric.value));
        webVitals.onLCP((metric) => reportVital('LCP', metric.value));
        webVitals.onTTFB((metric) => reportVital('TTFB', metric.value));
        webVitals.onINP?.((metric) => reportVital('INP', metric.value));
      }
    )
    .catch(() => {
      // web-vitals not installed, skip
      console.debug('[Performance] web-vitals library not available');
    });
}

// Import useState for hooks
import { useState } from 'react';
