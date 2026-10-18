import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  // Give dev server time to compile on first request
  await page.goto('/login', { timeout: 60_000 });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Rental Manager' })).toBeVisible({ timeout: 15_000 });

  await page.getByLabel('Email').fill('admin@rentalmanager.ph');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for client-side navigation (router.push) to dashboard
  // The dashboard shows "Hello" greeting — wait for that instead of URL change
  await expect(page.locator('body')).toContainText('Hello', { timeout: 30_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
