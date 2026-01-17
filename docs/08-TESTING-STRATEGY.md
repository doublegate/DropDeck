# DropDeck: Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for DropDeck, including unit testing, integration testing, end-to-end testing, and quality assurance practices.

---

## Testing Pyramid

```mermaid
flowchart TB
    subgraph Pyramid["Testing Pyramid"]
        direction TB
        E2E["E2E Tests (Playwright)<br/>~50 tests<br/>Slowest, Most Confidence"]
        Integration["Integration Tests<br/>~150 tests<br/>API, Database, Adapters"]
        Unit["Unit Tests (Vitest)<br/>~400 tests<br/>Fastest, Most Numerous"]
    end

    E2E --> Integration --> Unit

    style E2E fill:#ff6b6b
    style Integration fill:#ffd93d
    style Unit fill:#6bcb77
```

---

## Testing Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Unit & integration testing | `vitest.config.ts` |
| **Playwright** | E2E testing | `playwright.config.ts` |
| **Testing Library** | Component testing | `@testing-library/react` |
| **MSW** | API mocking | Mock Service Worker |
| **Faker** | Test data generation | `@faker-js/faker` |

---

## Unit Testing

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
```

### Test Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
  vi.stubEnv('TOKEN_ENCRYPTION_KEY', '0'.repeat(64));
  vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');
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
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
window.ResizeObserver = MockResizeObserver as any;
```

### Unit Test Examples

#### Utility Function Tests

```typescript
// lib/utils/time.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateETA,
  formatDuration,
  formatRelativeTime,
} from './time';

describe('calculateETA', () => {
  it('calculates minutes remaining correctly', () => {
    const arrival = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    const result = calculateETA(arrival);
    expect(result.minutesRemaining).toBeCloseTo(30, 0);
  });

  it('returns 0 for past times', () => {
    const arrival = new Date(Date.now() - 60 * 1000); // 1 min ago
    const result = calculateETA(arrival);
    expect(result.minutesRemaining).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1 hr 30 min');
  });

  it('handles edge case of exactly 60 minutes', () => {
    expect(formatDuration(60)).toBe('1 hr');
  });
});

describe('formatRelativeTime', () => {
  it('shows "just now" for recent times', () => {
    const recent = new Date(Date.now() - 30 * 1000);
    expect(formatRelativeTime(recent)).toBe('just now');
  });

  it('shows minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });
});
```

#### Encryption Tests

```typescript
// lib/encryption/tokens.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encryptToken, decryptToken } from './tokens';

describe('Token Encryption', () => {
  const testToken = 'test-access-token-12345';

  it('encrypts and decrypts token correctly', () => {
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(testToken);
  });

  it('produces different ciphertext for same input (random IV)', () => {
    const encrypted1 = encryptToken(testToken);
    const encrypted2 = encryptToken(testToken);
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
  });

  it('includes all required fields', () => {
    const encrypted = encryptToken(testToken);
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('iv');
    expect(encrypted).toHaveProperty('authTag');
    expect(encrypted).toHaveProperty('algorithm', 'aes-256-gcm');
    expect(encrypted).toHaveProperty('version');
  });

  it('fails with tampered ciphertext', () => {
    const encrypted = encryptToken(testToken);
    encrypted.ciphertext = 'tampered' + encrypted.ciphertext;
    expect(() => decryptToken(encrypted)).toThrow();
  });

  it('fails with tampered auth tag', () => {
    const encrypted = encryptToken(testToken);
    encrypted.authTag = 'AAAAAAAAAAAAAAAAAAAAAA==';
    expect(() => decryptToken(encrypted)).toThrow();
  });
});
```

#### Component Tests

```typescript
// components/dashboard/ETACountdown.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ETACountdown } from './ETACountdown';

describe('ETACountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays minutes remaining', () => {
    const eta = new Date(Date.now() + 15 * 60 * 1000);
    render(<ETACountdown eta={eta} />);
    expect(screen.getByText('15 min')).toBeInTheDocument();
  });

  it('updates countdown every second', () => {
    const eta = new Date(Date.now() + 2 * 60 * 1000);
    render(<ETACountdown eta={eta} />);

    expect(screen.getByText('2 min')).toBeInTheDocument();

    // Advance 60 seconds
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(screen.getByText('1 min')).toBeInTheDocument();
  });

  it('shows "Arriving" when under 2 minutes', () => {
    const eta = new Date(Date.now() + 90 * 1000);
    render(<ETACountdown eta={eta} />);
    expect(screen.getByText('Arriving')).toBeInTheDocument();
  });

  it('shows "Delivered" for past times', () => {
    const eta = new Date(Date.now() - 60 * 1000);
    render(<ETACountdown eta={eta} delivered />);
    expect(screen.getByText(/Delivered/)).toBeInTheDocument();
  });
});
```

#### Hook Tests

```typescript
// hooks/useCountdown.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial remaining time', () => {
    const target = new Date(Date.now() + 5 * 60 * 1000);
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.minutes).toBe(5);
  });

  it('decrements every second', () => {
    const target = new Date(Date.now() + 120 * 1000);
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.seconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.totalSeconds).toBe(119);
  });

  it('stops at zero', () => {
    const target = new Date(Date.now() + 1000);
    const { result } = renderHook(() => useCountdown(target));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.isComplete).toBe(true);
  });
});
```

---

## Integration Testing

### Database Integration Tests

```typescript
// tests/integration/db/platform-connections.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db/client';
import { platformConnections, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Platform Connections', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        name: 'Test User',
      })
      .returning();
    testUserId = user.id;
  });

  afterEach(async () => {
    // Cleanup
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('creates a platform connection', async () => {
    const [connection] = await db
      .insert(platformConnections)
      .values({
        userId: testUserId,
        platform: 'instacart',
        status: 'connected',
      })
      .returning();

    expect(connection.platform).toBe('instacart');
    expect(connection.status).toBe('connected');
  });

  it('enforces unique user-platform constraint', async () => {
    await db.insert(platformConnections).values({
      userId: testUserId,
      platform: 'doordash',
      status: 'connected',
    });

    // Attempting to insert duplicate should fail
    await expect(
      db.insert(platformConnections).values({
        userId: testUserId,
        platform: 'doordash',
        status: 'connected',
      })
    ).rejects.toThrow();
  });

  it('cascades delete when user is deleted', async () => {
    await db.insert(platformConnections).values({
      userId: testUserId,
      platform: 'ubereats',
      status: 'connected',
    });

    await db.delete(users).where(eq(users.id, testUserId));

    const connections = await db.query.platformConnections.findMany({
      where: eq(platformConnections.userId, testUserId),
    });

    expect(connections).toHaveLength(0);
  });
});
```

### tRPC Router Tests

```typescript
// tests/integration/routers/platform.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCaller } from '@/server/routers';
import { createMockContext } from '@/tests/utils/mock-context';

describe('Platform Router', () => {
  let caller: ReturnType<typeof createCaller>;
  let mockContext: Awaited<ReturnType<typeof createMockContext>>;

  beforeEach(async () => {
    mockContext = await createMockContext({
      userId: 'test-user-id',
    });
    caller = createCaller(mockContext);
  });

  describe('getConnections', () => {
    it('returns empty array when no connections', async () => {
      const connections = await caller.platform.getConnections();
      expect(connections).toEqual([]);
    });

    it('returns user connections', async () => {
      // Seed connection
      await mockContext.db.insert(platformConnections).values({
        userId: mockContext.user.id,
        platform: 'instacart',
        status: 'connected',
        lastSyncAt: new Date(),
      });

      const connections = await caller.platform.getConnections();
      expect(connections).toHaveLength(1);
      expect(connections[0].platform).toBe('instacart');
    });
  });

  describe('initiateOAuth', () => {
    it('returns auth URL for OAuth platforms', async () => {
      const result = await caller.platform.initiateOAuth({
        platform: 'instacart',
      });

      expect(result.authUrl).toContain('instacart.com');
      expect(result.state).toBeDefined();
    });

    it('stores state in Redis', async () => {
      const result = await caller.platform.initiateOAuth({
        platform: 'ubereats',
      });

      const storedState = await mockContext.redis.get(
        `oauth_state:${result.state}`
      );
      expect(storedState).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('removes platform connection', async () => {
      // Seed connection
      await mockContext.db.insert(platformConnections).values({
        userId: mockContext.user.id,
        platform: 'doordash',
        status: 'connected',
      });

      await caller.platform.disconnect({ platform: 'doordash' });

      const connections = await caller.platform.getConnections();
      expect(connections).toHaveLength(0);
    });
  });
});
```

### Adapter Integration Tests

```typescript
// tests/integration/adapters/instacart.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstacartAdapter } from '@/lib/adapters/instacart';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('InstacartAdapter', () => {
  const adapter = new InstacartAdapter();

  describe('getActiveDeliveries', () => {
    it('fetches and normalizes deliveries', async () => {
      server.use(
        http.get('https://connect.instacart.com/v2/orders', () => {
          return HttpResponse.json({
            orders: [
              {
                id: 'order-123',
                status: 'delivering',
                delivery: {
                  eta: '2026-01-16T15:30:00Z',
                  shopper: {
                    name: 'John',
                    location: { lat: 37.7749, lng: -122.4194 },
                  },
                },
              },
            ],
          });
        })
      );

      const deliveries = await adapter.getActiveDeliveries({
        accessToken: 'test-token',
        userId: 'user-123',
        platform: 'instacart',
      });

      expect(deliveries).toHaveLength(1);
      expect(deliveries[0].platform).toBe('instacart');
      expect(deliveries[0].status).toBe('out_for_delivery');
      expect(deliveries[0].driver?.location?.lat).toBe(37.7749);
    });

    it('handles API errors gracefully', async () => {
      server.use(
        http.get('https://connect.instacart.com/v2/orders', () => {
          return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await expect(
        adapter.getActiveDeliveries({
          accessToken: 'invalid-token',
          userId: 'user-123',
          platform: 'instacart',
        })
      ).rejects.toThrow();
    });
  });

  describe('verifyWebhook', () => {
    it('verifies valid webhook signature', () => {
      const payload = { event_id: '123', status: 'delivered' };
      const signature = adapter.generateWebhookSignature(payload);

      expect(adapter.verifyWebhook(payload, signature)).toBe(true);
    });

    it('rejects invalid signature', () => {
      const payload = { event_id: '123', status: 'delivered' };
      expect(adapter.verifyWebhook(payload, 'invalid-sig')).toBe(false);
    });
  });
});
```

---

## End-to-End Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### E2E Test Examples

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('displays login options', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
  });

  test('shows error for failed authentication', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });
});
```

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('displays empty state when no deliveries', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/no active deliveries/i)).toBeVisible();
  });

  test('displays delivery grid with active deliveries', async ({ page }) => {
    // Seed test delivery
    await page.evaluate(() => {
      window.__TEST_DELIVERIES__ = [
        {
          id: 'test-1',
          platform: 'instacart',
          status: 'out_for_delivery',
          eta: { minutesRemaining: 15 },
        },
      ];
    });

    await page.goto('/');
    await expect(page.getByTestId('delivery-pane')).toBeVisible();
    await expect(page.getByText('15 min')).toBeVisible();
  });

  test('sorts deliveries by ETA', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: /sort/i }).click();
    await page.getByRole('option', { name: /time to delivery/i }).click();

    // Verify first pane has lowest ETA
    const firstPane = page.getByTestId('delivery-pane').first();
    const etaText = await firstPane.getByTestId('eta').textContent();
    // Implementation-specific assertions
  });

  test('opens settings modal', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

```typescript
// tests/e2e/platform-connection.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './utils/auth';

test.describe('Platform Connection', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings/platforms');
  });

  test('displays all supported platforms', async ({ page }) => {
    const platforms = [
      'Instacart',
      'DoorDash',
      'Uber Eats',
      'Amazon',
      'Walmart+',
    ];

    for (const platform of platforms) {
      await expect(page.getByText(platform)).toBeVisible();
    }
  });

  test('shows connect button for disconnected platform', async ({ page }) => {
    const instacartCard = page.getByTestId('platform-instacart');
    await expect(
      instacartCard.getByRole('button', { name: /connect/i })
    ).toBeVisible();
  });

  test('initiates OAuth flow on connect', async ({ page }) => {
    await page.getByTestId('platform-instacart')
      .getByRole('button', { name: /connect/i })
      .click();

    // Should redirect to OAuth provider
    await expect(page).toHaveURL(/instacart\.com.*oauth/);
  });

  test('shows disconnect button for connected platform', async ({ page }) => {
    // Mock connected state
    await page.evaluate(() => {
      window.__TEST_CONNECTIONS__ = [
        { platform: 'doordash', status: 'connected' },
      ];
    });

    await page.reload();

    const doordashCard = page.getByTestId('platform-doordash');
    await expect(
      doordashCard.getByRole('button', { name: /disconnect/i })
    ).toBeVisible();
  });
});
```

---

## Test Coverage Targets

| Category | Target | Minimum |
|----------|--------|---------|
| **Statements** | 85% | 80% |
| **Branches** | 80% | 75% |
| **Functions** | 85% | 80% |
| **Lines** | 85% | 80% |

### Coverage by Module

| Module | Target | Priority |
|--------|--------|----------|
| `lib/encryption/` | 95% | Critical |
| `lib/adapters/` | 85% | High |
| `server/routers/` | 90% | High |
| `components/` | 80% | Medium |
| `hooks/` | 85% | Medium |
| `lib/utils/` | 90% | Medium |

---

## CI Pipeline Integration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run test --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/deliveries.ts
import { faker } from '@faker-js/faker';
import type { UnifiedDelivery } from '@/types/delivery';

export function createMockDelivery(
  overrides: Partial<UnifiedDelivery> = {}
): UnifiedDelivery {
  return {
    id: faker.string.uuid(),
    platform: faker.helpers.arrayElement([
      'instacart',
      'doordash',
      'ubereats',
    ] as const),
    externalOrderId: faker.string.alphanumeric(10),
    status: 'out_for_delivery',
    statusLabel: 'Out for delivery',
    statusUpdatedAt: new Date(),
    driver: {
      name: faker.person.firstName(),
      location: {
        lat: faker.location.latitude(),
        lng: faker.location.longitude(),
        timestamp: new Date(),
      },
    },
    destination: {
      address: faker.location.streetAddress(),
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
    },
    eta: {
      estimatedArrival: faker.date.soon(),
      minutesRemaining: faker.number.int({ min: 5, max: 60 }),
      confidence: 'high',
    },
    order: {
      itemCount: faker.number.int({ min: 1, max: 20 }),
    },
    tracking: {
      mapAvailable: true,
      liveUpdates: true,
      contactDriverAvailable: true,
    },
    timestamps: {
      ordered: faker.date.recent(),
    },
    meta: {
      lastFetchedAt: new Date(),
      fetchMethod: 'api',
      adapterId: 'test',
    },
    ...overrides,
  };
}
```

### Database Seeding

```typescript
// tests/utils/seed.ts
import { db } from '@/lib/db/client';
import { users, platformConnections } from '@/lib/db/schema';
import { encryptToken } from '@/lib/encryption/tokens';

export async function seedTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      email: 'test@dropdeck.app',
      name: 'Test User',
    })
    .returning();

  return user;
}

export async function seedPlatformConnection(
  userId: string,
  platform: string
) {
  const [connection] = await db
    .insert(platformConnections)
    .values({
      userId,
      platform: platform as any,
      accessTokenEncrypted: encryptToken('test-access-token'),
      refreshTokenEncrypted: encryptToken('test-refresh-token'),
      status: 'connected',
      lastSyncAt: new Date(),
    })
    .returning();

  return connection;
}

export async function cleanupTestData() {
  await db.delete(users).where(eq(users.email, 'test@dropdeck.app'));
}
```

---

## Performance Testing

### Vitest Benchmarks

```typescript
// benchmarks/encryption.bench.ts
import { bench, describe } from 'vitest';
import { encryptToken, decryptToken } from '@/lib/encryption/tokens';

describe('Encryption Performance', () => {
  const testToken = 'a'.repeat(1000);

  bench('encryptToken', () => {
    encryptToken(testToken);
  });

  bench('decryptToken', () => {
    const encrypted = encryptToken(testToken);
    decryptToken(encrypted);
  });
});
```

---

*Document Version: 1.0 | Last Updated: January 2026*
