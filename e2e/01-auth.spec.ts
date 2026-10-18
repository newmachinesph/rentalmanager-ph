/**
 * Authentication tests -- login page rendering, validation, successful login,
 * protected route redirect, logout flow, and session data verification.
 *
 * These run in a FRESH browser context (no stored auth) so every test
 * starts unauthenticated.
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('login page renders heading "Rental Manager", Email/Password fields, and Sign In button', async ({ page }) => {
    await page.goto('/login', { timeout: 60_000 });
    await waitForPageLoad(page);

    // Heading
    await expect(
      page.getByRole('heading', { name: 'Rental Manager' })
    ).toBeVisible({ timeout: 15_000 });

    // Email field
    await expect(page.getByLabel('Email')).toBeVisible();

    // Password field
    await expect(page.getByLabel('Password')).toBeVisible();

    // Sign In button
    await expect(
      page.getByRole('button', { name: 'Sign In' })
    ).toBeVisible();
  });

  test('invalid credentials show an error message', async ({ page }) => {
    await page.goto('/login', { timeout: 60_000 });
    await waitForPageLoad(page);
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // The error banner should appear with a relevant message
    await expect(
      page.getByText(/invalid|failed|error|incorrect/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('empty fields show "Please enter your email and password"', async ({ page }) => {
    await page.goto('/login', { timeout: 60_000 });
    await waitForPageLoad(page);
    await expect(
      page.getByRole('button', { name: 'Sign In' })
    ).toBeVisible({ timeout: 15_000 });

    // Submit without filling any field
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(
      page.getByText('Please enter your email and password')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('successful login redirects to dashboard (body contains "Hello")', async ({ page }) => {
    await page.goto('/login', { timeout: 60_000 });
    await waitForPageLoad(page);
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Email').fill('admin@rentalmanager.ph');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Dashboard shows "Hello" greeting after redirect
    await expect(page.locator('body')).toContainText('Hello', { timeout: 30_000 });
  });

  test('protected route /properties redirects to /login when unauthenticated', async ({ page }) => {
    await page.goto('/properties', { timeout: 30_000 });
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('logout flow: login -> click Admin button -> click "Sign Out" -> redirected to /login', async ({ page }) => {
    // Step 1: Log in
    await page.goto('/login', { timeout: 60_000 });
    await waitForPageLoad(page);
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Email').fill('admin@rentalmanager.ph');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for dashboard
    await expect(page.locator('body')).toContainText('Hello', { timeout: 30_000 });

    // Step 2: Open user dropdown -- the header button contains the user avatar
    const avatarButton = page
      .locator('header button')
      .filter({ has: page.locator('.rounded-full') })
      .first();
    await avatarButton.click();
    await page.waitForTimeout(300);

    // Step 3: Click "Sign Out" in the dropdown
    await page.getByRole('button', { name: /Sign Out/i }).click();

    // Step 4: Should be redirected to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test('after login, /api/auth/me returns correct session data (name, email, role)', async ({ page }) => {
    // Step 1: Log in via the UI
    await page.goto('/login', { timeout: 60_000 });
    await waitForPageLoad(page);
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 15_000 });

    await page.getByLabel('Email').fill('admin@rentalmanager.ph');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for dashboard to confirm we are logged in
    await expect(page.locator('body')).toContainText('Hello', { timeout: 30_000 });

    // Step 2: Verify the dashboard greeting includes the admin first name
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello Admin');

    // Step 3: Hit the session API and validate exact user data
    const response = await page.request.get('/api/auth/me');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.user).toBeTruthy();
    expect(data.user.name).toBe('Admin');
    expect(data.user.email).toBe('admin@rentalmanager.ph');
    expect(data.user.role).toBe('admin');
    // id should be a non-empty string
    expect(data.user.id).toBeTruthy();
    expect(typeof data.user.id).toBe('string');
  });
});
