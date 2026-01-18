/**
 * Playwright test fixtures for DropDeck E2E tests
 */

import { test as base, expect, type Page } from '@playwright/test';

/**
 * Extended fixtures for authenticated tests
 */
export interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Mock user data for E2E tests
 */
export const mockUser = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.png',
};

/**
 * Mock delivery data for E2E tests
 */
export const mockDeliveries = [
  {
    id: 'delivery-1',
    platform: 'doordash',
    status: 'out_for_delivery',
    statusLabel: 'Out for Delivery',
    eta: {
      minutesRemaining: 15,
      confidence: 'high',
    },
    destination: {
      address: '123 Main St, San Francisco, CA 94102',
    },
    order: {
      itemCount: 3,
      totalAmount: 2599,
    },
    driver: {
      name: 'John D.',
    },
  },
  {
    id: 'delivery-2',
    platform: 'ubereats',
    status: 'arriving',
    statusLabel: 'Arriving',
    eta: {
      minutesRemaining: 3,
      confidence: 'high',
    },
    destination: {
      address: '456 Oak Ave, San Francisco, CA 94103',
    },
    order: {
      itemCount: 1,
      totalAmount: 1299,
    },
    driver: {
      name: 'Sarah M.',
    },
  },
  {
    id: 'delivery-3',
    platform: 'instacart',
    status: 'preparing',
    statusLabel: 'Shopping',
    eta: {
      minutesRemaining: 45,
      confidence: 'medium',
    },
    destination: {
      address: '789 Elm St, San Francisco, CA 94104',
    },
    order: {
      itemCount: 12,
      totalAmount: 8750,
    },
  },
];

/**
 * Mock platform configurations
 */
export const mockPlatformConfigs = [
  {
    id: 'doordash',
    name: 'DoorDash',
    color: '#FF3008',
    connected: true,
  },
  {
    id: 'ubereats',
    name: 'Uber Eats',
    color: '#06C167',
    connected: true,
  },
  {
    id: 'instacart',
    name: 'Instacart',
    color: '#43B02A',
    connected: true,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    color: '#FF9900',
    connected: false,
  },
];

/**
 * Set up mock API responses
 */
export async function setupMockAPI(page: Page) {
  // Mock auth session
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });

  // Mock tRPC deliveries endpoint
  await page.route('**/api/trpc/delivery.getActive**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: mockDeliveries,
        },
      }),
    });
  });

  // Mock tRPC platforms endpoint
  await page.route('**/api/trpc/platform.list**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: mockPlatformConfigs,
        },
      }),
    });
  });

  // Mock tRPC preferences endpoint
  await page.route('**/api/trpc/preference.get**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            pushEnabled: true,
            inAppEnabled: true,
            soundEnabled: true,
            driverAssigned: true,
            outForDelivery: true,
            arrivingSoon: true,
            delivered: true,
            delayed: true,
          },
        },
      }),
    });
  });
}

/**
 * Set up authenticated page with mocked API
 */
export async function setupAuthenticatedPage(page: Page) {
  await setupMockAPI(page);

  // Set auth cookie
  await page.context().addCookies([
    {
      name: 'authjs.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      secure: false,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Extended test fixture with authentication
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await setupAuthenticatedPage(page);
    await use(page);
  },
});

export { expect };

/**
 * Custom assertions
 */
export async function expectDeliveryCard(page: Page, delivery: typeof mockDeliveries[0]) {
  const card = page.locator(`[data-delivery-id="${delivery.id}"]`);
  await expect(card).toBeVisible();
  await expect(card.locator('[data-testid="platform-badge"]')).toContainText(delivery.platform);
  await expect(card.locator('[data-testid="status-label"]')).toContainText(delivery.statusLabel);
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForAppLoad(page: Page) {
  // Wait for loading indicators to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading spinner might not exist if page loaded quickly
  });

  // Wait for main content to be visible
  await page.waitForSelector('main', { state: 'visible', timeout: 10000 });
}

/**
 * Navigate to dashboard and wait for content
 */
export async function goToDashboard(page: Page) {
  await page.goto('/dashboard');
  await waitForAppLoad(page);
}

/**
 * Navigate to settings and wait for content
 */
export async function goToSettings(page: Page) {
  await page.goto('/settings');
  await waitForAppLoad(page);
}
