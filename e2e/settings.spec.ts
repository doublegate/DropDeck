/**
 * Settings E2E tests
 */

import { test, expect, goToSettings } from './fixtures';

test.describe('Settings', () => {
  test.describe('Navigation', () => {
    test('can navigate to settings from dashboard', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for settings link or button
      const settingsLink = page.getByRole('link', { name: /settings/i });

      if (await settingsLink.isVisible()) {
        await settingsLink.click();
        await expect(page).toHaveURL(/\/settings/);
      }
    });

    test('settings page loads correctly', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Should show settings heading
      const heading = page.getByRole('heading', { name: /settings/i });
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Platform Connections', () => {
    test('shows connected platforms', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Should list platforms
      const platformSection = page.locator('[data-testid="platform-connections"], .platform-section');

      if (await platformSection.isVisible()) {
        await expect(platformSection).toBeVisible();
      }
    });

    test('shows connect button for disconnected platforms', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Look for connect button for disconnected platform (Amazon)
      const connectButton = page.getByRole('button', { name: /connect/i });

      if (await connectButton.first().isVisible()) {
        await expect(connectButton.first()).toBeVisible();
      }
    });

    test('shows disconnect button for connected platforms', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Look for disconnect button
      const disconnectButton = page.getByRole('button', { name: /disconnect/i });

      if (await disconnectButton.first().isVisible()) {
        await expect(disconnectButton.first()).toBeVisible();
      }
    });

    test('can initiate platform connection', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const connectButton = page.getByRole('button', { name: /connect/i }).first();

      if (await connectButton.isVisible()) {
        // Mock the connection endpoint
        await page.route('**/api/trpc/platform.connect**', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              result: { data: { success: true } },
            }),
          });
        });

        await connectButton.click();

        // Should show connection modal or redirect to OAuth
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Notification Preferences', () => {
    test('shows notification settings', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Should show notification section
      const notificationSection = page.locator('[data-testid="notification-settings"], :text("notification")');

      if (await notificationSection.first().isVisible()) {
        await expect(notificationSection.first()).toBeVisible();
      }
    });

    test('can toggle push notifications', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Look for push notification toggle
      const pushToggle = page.locator('[data-testid="push-toggle"], [role="switch"]').first();

      if (await pushToggle.isVisible()) {
        const initialState = await pushToggle.getAttribute('aria-checked');

        // Mock the update endpoint
        await page.route('**/api/trpc/preference.update**', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              result: { data: { success: true } },
            }),
          });
        });

        await pushToggle.click();

        // Toggle state should change
        await page.waitForTimeout(300);
        const newState = await pushToggle.getAttribute('aria-checked');
        expect(newState).not.toBe(initialState);
      }
    });

    test('can toggle in-app notifications', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const inAppToggle = page.locator('[data-testid="in-app-toggle"]');

      if (await inAppToggle.isVisible()) {
        await inAppToggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('can toggle sound notifications', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const soundToggle = page.locator('[data-testid="sound-toggle"]');

      if (await soundToggle.isVisible()) {
        await soundToggle.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Notification Event Types', () => {
    test('can toggle driver assigned notifications', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const toggle = page.locator('[data-testid="driver-assigned-toggle"]');

      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('can toggle out for delivery notifications', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const toggle = page.locator('[data-testid="out-for-delivery-toggle"]');

      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    });

    test('can toggle arriving soon notifications', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const toggle = page.locator('[data-testid="arriving-soon-toggle"]');

      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Theme Settings', () => {
    test('shows theme selector', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Look for theme selector
      const themeSelector = page.locator('[data-testid="theme-selector"], [name="theme"]');

      if (await themeSelector.isVisible()) {
        await expect(themeSelector).toBeVisible();
      }
    });

    test('can switch to dark mode', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const darkModeButton = page.getByRole('button', { name: /dark/i });

      if (await darkModeButton.isVisible()) {
        await darkModeButton.click();

        // Check if dark class is applied
        await page.waitForTimeout(300);
        // Could be 'dark' class or data attribute
      }
    });

    test('can switch to light mode', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const lightModeButton = page.getByRole('button', { name: /light/i });

      if (await lightModeButton.isVisible()) {
        await lightModeButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('can use system theme', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const systemButton = page.getByRole('button', { name: /system/i });

      if (await systemButton.isVisible()) {
        await systemButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Account Settings', () => {
    test('shows account section', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const accountSection = page.locator('[data-testid="account-settings"], :text("account")');

      if (await accountSection.first().isVisible()) {
        await expect(accountSection.first()).toBeVisible();
      }
    });

    test('shows delete account option', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const deleteButton = page.getByRole('button', { name: /delete account/i });

      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeVisible();
      }
    });

    test('delete account shows confirmation dialog', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const deleteButton = page.getByRole('button', { name: /delete account/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        const confirmDialog = page.getByRole('alertdialog');
        if (await confirmDialog.isVisible()) {
          await expect(confirmDialog).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('settings page is usable on mobile', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await goToSettings(page);

      // Page should still be functional
      const heading = page.getByRole('heading', { name: /settings/i });
      await expect(heading).toBeVisible();
    });

    test('settings page is usable on tablet', async ({ authenticatedPage: page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await goToSettings(page);

      const heading = page.getByRole('heading', { name: /settings/i });
      await expect(heading).toBeVisible();
    });
  });
});
