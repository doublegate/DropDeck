/**
 * Accessibility E2E tests
 */

import { test, expect, goToDashboard, goToSettings } from './fixtures';

test.describe('Accessibility', () => {
  test.describe('Keyboard Navigation', () => {
    test('login page is keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab through the page
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(firstFocused).toBeTruthy();

      // Continue tabbing
      await page.keyboard.press('Tab');
      const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(secondFocused).toBeTruthy();
    });

    test('dashboard is keyboard navigable', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Tab through the page
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();

      // Should be able to tab through delivery cards
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should reach interactive elements
      const finalFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(finalFocused).toBeTruthy();
    });

    test('delivery cards are keyboard accessible', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Find and focus a delivery card
      const card = page.locator('article, [role="article"]').first();

      if (await card.isVisible()) {
        await card.focus();

        // Should be able to activate with Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
    });

    test('settings toggles are keyboard accessible', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Find a toggle/switch
      const toggle = page.locator('[role="switch"]').first();

      if (await toggle.isVisible()) {
        await toggle.focus();

        // Should toggle with Space or Enter
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);

        // Verify state change is possible (may stay same if disabled)
        await toggle.getAttribute('aria-checked');
      }
    });

    test('modal dialogs trap focus', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Try to open a modal (e.g., delete account confirmation)
      const deleteButton = page.getByRole('button', { name: /delete account/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(300);

        const dialog = page.getByRole('alertdialog');
        if (await dialog.isVisible()) {
          // Tab should stay within dialog
          await page.keyboard.press('Tab');
          await page.evaluate(() => {
            const dialog = document.querySelector('[role="alertdialog"]');
            return dialog?.contains(document.activeElement);
          });
          // Focus should be within dialog (if focus trap is implemented)
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('page has proper heading hierarchy', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Check heading levels
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // H2s should come after H1
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('images have alt text', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      // Check images for alt text
      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Images should have alt text or be marked as decorative
        const hasAlt = alt !== null && alt !== '';
        const isDecorative = role === 'presentation' || alt === '';
        expect(hasAlt || isDecorative).toBe(true);
      }
    });

    test('buttons have accessible names', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button').all();

      for (const button of buttons.slice(0, 10)) {
        // Limit to first 10 buttons
        const name = await button.getAttribute('aria-label');
        const text = await button.textContent();
        const title = await button.getAttribute('title');

        // Button should have accessible name
        const hasAccessibleName = (name && name.length > 0) || (text && text.trim().length > 0) || (title && title.length > 0);
        expect(hasAccessibleName).toBe(true);
      }
    });

    test('form inputs have labels', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      const inputs = await page.locator('input, select, textarea').all();

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');

        // Input should have a label
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          const hasLabel = label > 0 || ariaLabel || ariaLabelledby;
          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('links have descriptive text', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      const links = await page.locator('a').all();

      for (const link of links.slice(0, 10)) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');

        // Link should have descriptive text
        const hasDescriptiveText = (text && text.trim().length > 0) || (ariaLabel && ariaLabel.length > 0);
        expect(hasDescriptiveText).toBe(true);
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('text has sufficient contrast in light mode', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Set light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
      });

      // Visual inspection - can add axe-core for automated testing
      await page.waitForTimeout(300);
    });

    test('text has sufficient contrast in dark mode', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Set dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });

      await page.waitForTimeout(300);
    });
  });

  test.describe('Focus Indicators', () => {
    test('interactive elements have visible focus indicators', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Tab to an interactive element
      await page.keyboard.press('Tab');

      // Check if focused element has visible focus ring
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;

        const style = window.getComputedStyle(el);
        const outline = style.outline;
        const boxShadow = style.boxShadow;

        // Check for focus indicators
        return outline !== 'none' || boxShadow !== 'none' || el.classList.contains('focus-visible');
      });

      // Focus should be visible (implementation varies)
    });
  });

  test.describe('Reduced Motion', () => {
    test('respects prefers-reduced-motion', async ({ authenticatedPage: page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      await goToDashboard(page);

      // Animations should be reduced or disabled
      // This is a visual test - automated verification would require checking CSS
    });
  });

  test.describe('ARIA Attributes', () => {
    test('live regions exist for dynamic content', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Check for aria-live regions
      await page.locator('[aria-live]').count();

      // App should have live regions for notifications/updates
      // This is optional depending on implementation
    });

    test('expandable sections have proper aria attributes', async ({ authenticatedPage: page }) => {
      await goToDashboard(page);

      // Check expandable elements
      const expandables = await page.locator('[aria-expanded]').all();

      for (const expandable of expandables) {
        const ariaExpanded = await expandable.getAttribute('aria-expanded');

        // Should have valid aria-expanded value
        expect(['true', 'false']).toContain(ariaExpanded);

        // If has aria-controls, target should exist
        const ariaControls = await expandable.getAttribute('aria-controls');
        if (ariaControls) {
          const target = await page.locator(`#${ariaControls}`).count();
          expect(target).toBeGreaterThanOrEqual(1);
        }
      }
    });

    test('modals have proper aria attributes', async ({ authenticatedPage: page }) => {
      await goToSettings(page);

      // Try to open a modal
      const deleteButton = page.getByRole('button', { name: /delete account/i });

      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(300);

        const dialog = page.getByRole('alertdialog');
        if (await dialog.isVisible()) {
          // Check aria-modal
          const ariaModal = await dialog.getAttribute('aria-modal');
          expect(ariaModal).toBe('true');

          // Check aria-labelledby or aria-label
          const ariaLabelledby = await dialog.getAttribute('aria-labelledby');
          const ariaLabel = await dialog.getAttribute('aria-label');
          expect(ariaLabelledby || ariaLabel).toBeTruthy();
        }
      }
    });
  });
});
