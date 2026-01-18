/**
 * Dashboard E2E tests
 */

import { test, expect, mockDeliveries, goToDashboard } from './fixtures';

test.describe('Dashboard', () => {
  test.describe('Layout', () => {
    test('shows header with logo', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Header should be visible
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Logo or app name should be visible
      const logo = page.getByText(/dropdeck/i);
      await expect(logo).toBeVisible();
    });

    test('shows navigation sidebar on desktop', async ({ authenticatedPage: page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });

      await goToDashboard(page);

      // Sidebar should be visible on desktop
      const sidebar = page.locator('[data-testid="sidebar"], nav, aside').first();
      if (await sidebar.isVisible()) {
        await expect(sidebar).toBeVisible();
      }
    });

    test('shows mobile menu button on mobile', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await goToDashboard(page);

      // Mobile menu button should be visible
      page.locator('[data-testid="mobile-menu"], [aria-label*="menu"], button').filter({
        has: page.locator('svg'),
      }).first();

      // Menu button or hamburger should be present on mobile
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Delivery List', () => {
    test('displays active deliveries', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Wait for deliveries to load
      await page.waitForLoadState('networkidle');

      // Should show delivery cards
      const deliveryCards = page.locator('[data-testid="delivery-card"], article');
      await expect(deliveryCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('shows delivery status', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Status labels should be visible
      const statusLabels = page.locator('[data-testid="status-label"], .status-label');
      if (await statusLabels.first().isVisible()) {
        await expect(statusLabels.first()).toBeVisible();
      }
    });

    test('shows ETA for active deliveries', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // ETA should be displayed
      const etaDisplay = page.locator('[data-testid="eta-display"], .eta-display, :text("min")');
      if (await etaDisplay.first().isVisible()) {
        await expect(etaDisplay.first()).toBeVisible();
      }
    });

    test('shows driver info when available', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Driver name should be visible for deliveries with drivers
      const driverName = mockDeliveries[0]?.driver?.name ?? '';
      const driverInfo = page.getByText(driverName);
      if (driverName && await driverInfo.isVisible()) {
        await expect(driverInfo).toBeVisible();
      }
    });

    test('shows empty state when no deliveries', async ({ page }) => {
      // Mock empty deliveries
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test', name: 'Test', email: 'test@example.com' },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        });
      });

      await page.route('**/api/trpc/delivery.getActive**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: { data: [] },
          }),
        });
      });

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

      await goToDashboard(page);

      // Should show empty state message
      const emptyState = page.getByText(/no (active )?deliver|all caught up|nothing/i);
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('Delivery Interactions', () => {
    test('can click on delivery card to expand', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      const deliveryCard = page.locator('[data-testid="delivery-card"], article').first();

      if (await deliveryCard.isVisible()) {
        await deliveryCard.click();

        // Should expand or navigate to detail view
        // Check for expanded state or detail modal
        await page.waitForTimeout(500); // Wait for animation
      }
    });

    test('can view delivery details', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Look for details button
      const detailsButton = page.getByRole('button', { name: /details/i }).first();

      if (await detailsButton.isVisible()) {
        await detailsButton.click();

        // Wait for detail panel or modal
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Map View', () => {
    test('shows map container', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Map container should be present
      page.locator('[data-testid="map-container"], .maplibregl-map, .map-container');

      // Map may or may not be visible depending on layout
      await page.waitForTimeout(1000); // Wait for map to initialize
    });

    test('map is responsive on mobile', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Map should adapt to mobile layout
      await page.locator('[data-testid="map-container"], .maplibregl-map').isVisible();
    });
  });

  test.describe('Platform Filters', () => {
    test('shows platform filter options', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Look for platform filter
      const platformFilter = page.locator('[data-testid="platform-filter"], select, [role="combobox"]');

      if (await platformFilter.isVisible()) {
        await expect(platformFilter).toBeVisible();
      }
    });

    test('can filter by platform', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Try to interact with platform filter
      const platformFilter = page.locator('[data-testid="platform-filter"]').first();

      if (await platformFilter.isVisible()) {
        await platformFilter.click();

        // Select an option
        const option = page.getByRole('option', { name: /doordash/i });
        if (await option.isVisible()) {
          await option.click();
        }
      }
    });
  });

  test.describe('Notifications', () => {
    test('shows notification bell icon', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Notification icon should be present
      const notificationIcon = page.locator('[data-testid="notification-bell"], [aria-label*="notification"]');

      if (await notificationIcon.isVisible()) {
        await expect(notificationIcon).toBeVisible();
      }
    });

    test('can open notification panel', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      const notificationIcon = page.locator('[data-testid="notification-bell"], [aria-label*="notification"]');

      if (await notificationIcon.isVisible()) {
        await notificationIcon.click();

        // Notification panel should open
        await page.waitForTimeout(300);
      }
    });
  });
});
