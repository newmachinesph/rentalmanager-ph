/**
 * Navigation tests -- sidebar brand, all sidebar links visible, clicking
 * each link navigates to the correct URL, and each page loads with the
 * correct heading text.
 *
 * Uses stored auth (admin session from auth.setup.ts).
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toContainText('Hello', { timeout: 15_000 });
  });

  test('sidebar shows brand "Rental Manager"', async ({ page }) => {
    await expect(page.getByText('Rental Manager').first()).toBeVisible();
  });

  test('all 11 sidebar links are visible', async ({ page }) => {
    const sidebarLinks = [
      'Dashboard',
      'Properties',
      'Tenants',
      'Leases',
      'Income',
      'Expenses',
      'Maintenance',
      'Utilities',
      'Contracts',
      'Organization',
    ];

    for (const label of sidebarLinks) {
      await expect(
        page.getByRole('link', { name: label })
      ).toBeVisible();
    }

    // Reports is also a direct sidebar link
    await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();
  });

  test('clicking each link navigates to the correct URL path', async ({ page }) => {
    const navTests: { label: string; urlPattern: RegExp }[] = [
      { label: 'Properties', urlPattern: /\/properties$/ },
      { label: 'Tenants', urlPattern: /\/tenants$/ },
      { label: 'Leases', urlPattern: /\/leases$/ },
      { label: 'Income', urlPattern: /\/income$/ },
      { label: 'Expenses', urlPattern: /\/expenses$/ },
      { label: 'Maintenance', urlPattern: /\/maintenance$/ },
      { label: 'Utilities', urlPattern: /\/utilities$/ },
      { label: 'Contracts', urlPattern: /\/contracts$/ },
      { label: 'Organization', urlPattern: /\/organization$/ },
      { label: 'Reports', urlPattern: /\/reports$/ },
      // Dashboard is last so we end back at the root
      { label: 'Dashboard', urlPattern: /\/$/ },
    ];

    for (const { label, urlPattern } of navTests) {
      await page.getByRole('link', { name: label }).click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });
    }
  });

  test('each page loads with correct heading text (business logic)', async ({ page }) => {
    const pageExpectations: { label: string; urlPattern: RegExp; heading: string | RegExp }[] = [
      { label: 'Properties', urlPattern: /\/properties$/, heading: 'Properties' },
      { label: 'Tenants', urlPattern: /\/tenants$/, heading: 'Tenants' },
      { label: 'Leases', urlPattern: /\/leases$/, heading: 'Leases' },
      { label: 'Income', urlPattern: /\/income$/, heading: 'Income' },
      { label: 'Expenses', urlPattern: /\/expenses$/, heading: 'Expenses' },
      { label: 'Maintenance', urlPattern: /\/maintenance$/, heading: 'Maintenance' },
      { label: 'Utilities', urlPattern: /\/utilities$/, heading: 'Utilities' },
      { label: 'Contracts', urlPattern: /\/contracts$/, heading: 'Contracts' },
      { label: 'Organization', urlPattern: /\/organization$/, heading: 'Example Holdings Inc.' },
      { label: 'Reports', urlPattern: /\/reports$/, heading: 'Reports' },
      { label: 'Dashboard', urlPattern: /\/$/, heading: /Hello/ },
    ];

    for (const { label, urlPattern, heading } of pageExpectations) {
      await page.getByRole('link', { name: label }).click();
      await waitForPageLoad(page);
      await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });

      // Verify each page has the correct heading
      if (heading instanceof RegExp) {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(heading, { timeout: 15_000 });
      } else {
        await expect(
          page.getByRole('heading', { name: heading }).first()
        ).toBeVisible({ timeout: 15_000 });
      }
    }
  });
});
