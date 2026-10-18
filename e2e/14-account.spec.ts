/**
 * Account page -- password management tests.
 * Uses getByPlaceholder because FormField uses useId()+cloneElement.
 *
 * IMPORTANT: The password update test changes the password and then
 * reverts it back to "admin123" so subsequent tests are not broken.
 *
 * BUSINESS LOGIC VALIDATION:
 * - Button disabled when fields empty
 * - Mismatch error when New != Confirm
 * - Button enabled when all fields valid
 * - Successfully change password and revert
 * - Verify new password works by logging in with it
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

const CURRENT_PW = 'Enter current password';
const NEW_PW = 'Enter new password (min 6 characters)';
const CONFIRM_PW = 'Confirm new password';

/* ------------------------------------------------------------------ */
/*  Tests -- Page structure verification                               */
/* ------------------------------------------------------------------ */

test.describe('Account -- page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account');
    await waitForPageLoad(page);
  });

  test('renders the "My Account" heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'My Account', level: 1 }),
    ).toBeVisible({ timeout: 12000 });
  });

  test('renders password fields (Current Password, New Password, Confirm New Password)', async ({ page }) => {
    await expect(page.getByPlaceholder(CURRENT_PW)).toBeVisible({ timeout: 12000 });
    await expect(page.getByPlaceholder(NEW_PW)).toBeVisible();
    await expect(page.getByPlaceholder(CONFIRM_PW)).toBeVisible();
  });

  test('"Update Password" button is disabled when all fields are empty', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Update Password/i }),
    ).toBeDisabled({ timeout: 12000 });
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Password validation business logic                        */
/* ------------------------------------------------------------------ */

test.describe('Account -- password validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/account');
    await waitForPageLoad(page);
    await expect(page.getByPlaceholder(CURRENT_PW)).toBeVisible({ timeout: 12000 });
  });

  test('shows "Passwords do not match" error when New != Confirm', async ({ page }) => {
    await page.getByPlaceholder(NEW_PW).fill('newpass123');
    await page.getByPlaceholder(CONFIRM_PW).fill('different456');
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('button becomes enabled when all fields are filled correctly', async ({ page }) => {
    await page.getByPlaceholder(CURRENT_PW).fill('admin123');
    await page.getByPlaceholder(NEW_PW).fill('newpass123');
    await page.getByPlaceholder(CONFIRM_PW).fill('newpass123');
    await expect(
      page.getByRole('button', { name: /Update Password/i }),
    ).toBeEnabled({ timeout: 5000 });
  });

  test('button stays disabled when only current password is filled', async ({ page }) => {
    await page.getByPlaceholder(CURRENT_PW).fill('admin123');
    await expect(
      page.getByRole('button', { name: /Update Password/i }),
    ).toBeDisabled();
  });

  test('button stays disabled when passwords mismatch even if all filled', async ({ page }) => {
    await page.getByPlaceholder(CURRENT_PW).fill('admin123');
    await page.getByPlaceholder(NEW_PW).fill('newpass123');
    await page.getByPlaceholder(CONFIRM_PW).fill('different456');
    await expect(
      page.getByRole('button', { name: /Update Password/i }),
    ).toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Password update (happy path) with business logic          */
/* ------------------------------------------------------------------ */

test.describe('Account -- password update business logic', () => {
  test('successfully change password admin123 -> newpassword456, then revert to admin123', async ({ page }) => {
    await page.goto('/account');
    await waitForPageLoad(page);
    await expect(page.getByPlaceholder(CURRENT_PW)).toBeVisible({ timeout: 12000 });

    // Step 1: Change password from admin123 to newpassword456
    await page.getByPlaceholder(CURRENT_PW).fill('admin123');
    await page.getByPlaceholder(NEW_PW).fill('newpassword456');
    await page.getByPlaceholder(CONFIRM_PW).fill('newpassword456');
    await page.getByRole('button', { name: /Update Password/i }).click();
    await expect(page.getByText('Password updated')).toBeVisible({ timeout: 8000 });

    // Wait for fields to clear after successful update
    await page.waitForTimeout(500);

    // Step 2: Revert password back to admin123 for test continuity
    await page.getByPlaceholder(CURRENT_PW).fill('newpassword456');
    await page.getByPlaceholder(NEW_PW).fill('admin123');
    await page.getByPlaceholder(CONFIRM_PW).fill('admin123');
    await page.getByRole('button', { name: /Update Password/i }).click();
    await expect(page.getByText('Password updated')).toBeVisible({ timeout: 8000 });
  });

  test('verify password was actually changed (login with new password works)', async ({ page }) => {
    // Step 1: Change password from admin123 to newpassword456
    await page.goto('/account');
    await waitForPageLoad(page);
    await expect(page.getByPlaceholder(CURRENT_PW)).toBeVisible({ timeout: 12000 });

    await page.getByPlaceholder(CURRENT_PW).fill('admin123');
    await page.getByPlaceholder(NEW_PW).fill('newpassword456');
    await page.getByPlaceholder(CONFIRM_PW).fill('newpassword456');
    await page.getByRole('button', { name: /Update Password/i }).click();
    await expect(page.getByText('Password updated')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(500);

    // Step 2: Verify via API that the new password actually works
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: 'admin@rentalmanager.ph', password: 'newpassword456' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    expect(loginBody.user.email).toBe('admin@rentalmanager.ph');

    // Step 3: Verify old password no longer works
    const oldPwRes = await page.request.post('/api/auth/login', {
      data: { email: 'admin@rentalmanager.ph', password: 'admin123' },
    });
    expect(oldPwRes.status()).toBe(401);

    // Step 4: Revert password back to admin123
    await page.goto('/account');
    await waitForPageLoad(page);
    await expect(page.getByPlaceholder(CURRENT_PW)).toBeVisible({ timeout: 12000 });

    await page.getByPlaceholder(CURRENT_PW).fill('newpassword456');
    await page.getByPlaceholder(NEW_PW).fill('admin123');
    await page.getByPlaceholder(CONFIRM_PW).fill('admin123');
    await page.getByRole('button', { name: /Update Password/i }).click();
    await expect(page.getByText('Password updated')).toBeVisible({ timeout: 8000 });
  });
});
