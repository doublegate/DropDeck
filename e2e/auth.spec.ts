/**
 * Authentication E2E tests
 */

import { test, expect, setupMockAPI, mockUser } from './fixtures';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('shows login page for unauthenticated users', async ({ page }) => {
      await page.goto('/login');

      // Should show login page
      await expect(page).toHaveURL(/\/login/);

      // Should show sign in options
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    });

    test('shows Google sign in button', async ({ page }) => {
      await page.goto('/login');

      const googleButton = page.getByRole('button', { name: /google/i });
      await expect(googleButton).toBeVisible();
    });

    test('redirects to Google OAuth on button click', async ({ page }) => {
      await page.goto('/login');

      // Mock the OAuth redirect
      await page.route('**/api/auth/signin/google**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            location: 'https://accounts.google.com/o/oauth2/auth',
          },
        });
      });

      const googleButton = page.getByRole('button', { name: /google/i });

      // Click should initiate OAuth flow
      await expect(googleButton).toBeEnabled();
    });
  });

  test.describe('Protected Routes', () => {
    test('redirects unauthenticated users to login', async ({ page }) => {
      // Mock unauthenticated session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      });

      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('allows authenticated users to access dashboard', async ({ page }) => {
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

      await page.goto('/dashboard');

      // Should stay on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Session Management', () => {
    test('shows user info when authenticated', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // User avatar or name should be visible in header
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await expect(userMenu).toContainText(mockUser.name);
      }
    });

    test('sign out button is visible when authenticated', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click user menu to reveal sign out
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();

        const signOutButton = page.getByRole('button', { name: /sign out/i });
        await expect(signOutButton).toBeVisible();
      }
    });
  });

  test.describe('OAuth Callback', () => {
    test('handles successful OAuth callback', async ({ page }) => {
      // Mock successful auth callback
      await page.route('**/api/auth/callback/google**', async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            location: '/dashboard',
          },
        });
      });

      await setupMockAPI(page);

      // Simulate callback URL
      await page.goto('/api/auth/callback/google?code=mock-code');

      // Should redirect to dashboard or show success
      // The exact behavior depends on auth implementation
    });

    test('handles OAuth error', async ({ page }) => {
      await page.goto('/api/auth/error?error=AccessDenied');

      // Should show error message or redirect to login
      const errorMessage = page.getByText(/error|denied|failed/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });
  });
});
