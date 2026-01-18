/**
 * Vitest test setup file
 * Configures testing environment, mocks, and global utilities
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
  vi.stubEnv('DATABASE_URL_UNPOOLED', 'postgresql://test:test@localhost:5432/test');
  vi.stubEnv('TOKEN_ENCRYPTION_KEY', '0'.repeat(64));
  vi.stubEnv('AUTH_SECRET', 'test-secret-key-for-testing-only');
  vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-testing-only');
  vi.stubEnv('NEXT_PUBLIC_ABLY_API_KEY', 'test-ably-key');
  vi.stubEnv('UPSTASH_REDIS_URL', 'https://test-redis.upstash.io');
  vi.stubEnv('UPSTASH_REDIS_TOKEN', 'test-redis-token');
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.ResizeObserver = MockResizeObserver;

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
  },
});

// Mock requestAnimationFrame
window.requestAnimationFrame = vi.fn((callback) => {
  callback(Date.now());
  return 0;
});

window.cancelAnimationFrame = vi.fn();

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock MapLibre GL (heavy library)
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      removeControl: vi.fn(),
      addSource: vi.fn(),
      removeSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      getSource: vi.fn(),
      getLayer: vi.fn(),
      setCenter: vi.fn(),
      setZoom: vi.fn(),
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      resize: vi.fn(),
      getCanvas: vi.fn().mockReturnValue({
        style: {},
      }),
    })),
    Marker: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      getElement: vi.fn().mockReturnValue(document.createElement('div')),
    })),
    NavigationControl: vi.fn(),
    GeolocateControl: vi.fn(),
    supported: vi.fn().mockReturnValue(true),
  },
  Map: vi.fn(),
  Marker: vi.fn(),
  NavigationControl: vi.fn(),
  GeolocateControl: vi.fn(),
}));

// Mock react-map-gl (wrapper around MapLibre)
vi.mock('react-map-gl/maplibre', () => ({
  default: vi.fn(({ children }) => children),
  Map: vi.fn(({ children }) => children),
  Marker: vi.fn(({ children }) => children),
  Source: vi.fn(({ children }) => children),
  Layer: vi.fn(() => null),
  NavigationControl: vi.fn(() => null),
  GeolocateControl: vi.fn(() => null),
  useMap: vi.fn().mockReturnValue({
    current: {
      getMap: vi.fn().mockReturnValue({
        flyTo: vi.fn(),
        setCenter: vi.fn(),
      }),
    },
  }),
}));

// Mock Ably for real-time notifications
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

// Mock framer-motion (reduce animation complexity in tests)
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => {
        const { initial, animate, exit, whileHover, whileTap, layout, ...domProps } = props as Record<string, unknown>;
        return <div {...domProps}>{children}</div>;
      },
      span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => {
        const { initial, animate, exit, whileHover, whileTap, layout, ...domProps } = props as Record<string, unknown>;
        return <span {...domProps}>{children}</span>;
      },
      button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => {
        const { initial, animate, exit, whileHover, whileTap, layout, ...domProps } = props as Record<string, unknown>;
        return <button type="button" {...domProps}>{children}</button>;
      },
    },
  };
});

// Suppress console.error for expected test errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Ignore React act() warnings in tests
    if (typeof args[0] === 'string' && args[0].includes('act(...)')) {
      return;
    }
    // Ignore hydration warnings
    if (typeof args[0] === 'string' && args[0].includes('Hydration')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});
