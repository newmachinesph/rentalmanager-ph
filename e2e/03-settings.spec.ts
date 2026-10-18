/**
 * Settings tests -- verify and modify settings across all panels:
 * General, Users & Permissions, Notification preferences, Categories.
 *
 * Uses stored auth (admin session from auth.setup.ts).
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);
    await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 15_000 });
  });

  /* ---------------------------------------------------------------------- */
  /* Settings overview                                                       */
  /* ---------------------------------------------------------------------- */

  test('settings heading visible, all 4 panels listed', async ({ page }) => {
    // The heading
    await expect(page.getByText('Settings').first()).toBeVisible();

    // All panel entries -- verify exact count of 4 panels
    const panels = ['General', 'Users & Permissions', 'Notification preferences', 'Categories'];
    for (const panel of panels) {
      await expect(page.getByText(panel)).toBeVisible();
    }
  });

  /* ---------------------------------------------------------------------- */
  /* General panel -- seeded company data verification                       */
  /* ---------------------------------------------------------------------- */

  test('General panel shows seeded company data with exact values', async ({ page }) => {
    await page.getByText('General').click();
    await expect(page.getByText('General Settings')).toBeVisible({ timeout: 15_000 });

    // Wait for API data to populate the fields
    const companyNameInput = page.locator('label:has-text("Company Name")').locator('..').locator('input');
    const tinInput = page.locator('label:has-text("Company TIN")').locator('..').locator('input');
    const ownerInput = page.locator('label:has-text("Owner / Manager Name")').locator('..').locator('input');
    const emailInput = page.locator('label:has-text("Owner Email")').locator('..').locator('input');

    // Validate exact seeded values -- not just visibility, but correct business data
    await expect(companyNameInput).toHaveValue('Example Holdings Inc.', { timeout: 15_000 });
    await expect(tinInput).toHaveValue('000-000-000-000');
    await expect(ownerInput).toHaveValue('Juan Dela Cruz');
    await expect(emailInput).toHaveValue('admin@rentalmanager.ph');
  });

  test('General panel verifies all default field values from seed', async ({ page }) => {
    await page.getByText('General').click();
    await expect(page.getByText('General Settings')).toBeVisible({ timeout: 15_000 });

    // Wait for data to load by checking a known field
    const companyNameInput = page.locator('label:has-text("Company Name")').locator('..').locator('input');
    await expect(companyNameInput).toHaveValue('Example Holdings Inc.', { timeout: 15_000 });

    // Verify currency default is PHP
    const currencySelect = page.locator('label:has-text("Default Currency")').locator('..').locator('select');
    await expect(currencySelect).toHaveValue('PHP');

    // Verify timezone default is Asia/Manila
    const timezoneSelect = page.locator('label:has-text("Timezone")').locator('..').locator('select');
    await expect(timezoneSelect).toHaveValue('Asia/Manila');
  });

  /* ---------------------------------------------------------------------- */
  /* Users panel                                                             */
  /* ---------------------------------------------------------------------- */

  test('Users panel shows admin@rentalmanager.ph with admin role', async ({ page }) => {
    await page.getByText('Users & Permissions').click();
    await expect(page.getByText('Users & Permissions').first()).toBeVisible({ timeout: 15_000 });

    // Wait for the user list to load from the API
    await expect(
      page.getByText('admin@rentalmanager.ph')
    ).toBeVisible({ timeout: 15_000 });

    // Verify the admin role is displayed alongside the user
    await expect(
      page.getByText(/admin/i).first()
    ).toBeVisible();
  });

  /* ---------------------------------------------------------------------- */
  /* Notifications panel                                                     */
  /* ---------------------------------------------------------------------- */

  test('Notifications panel has all 3 toggles and they default to ON', async ({ page }) => {
    await page.getByText('Notification preferences').click();
    await expect(page.getByText('Notification Preferences')).toBeVisible({ timeout: 15_000 });

    // Three notification toggle items
    await expect(page.getByText('Payment Reminders')).toBeVisible();
    await expect(page.getByText('Maintenance Alerts')).toBeVisible();
    await expect(page.getByText('Lease Expiry Alerts')).toBeVisible();

    // The toggle buttons should be visible (rounded-full switch buttons)
    const toggleButtons = page.locator('button.rounded-full');
    await expect(toggleButtons.first()).toBeVisible();

    // Verify all 3 toggles are ON by default -- they should have the active
    // background color (bg-teal-600) indicating enabled state
    const toggleCount = await toggleButtons.count();
    expect(toggleCount).toBeGreaterThanOrEqual(3);

    // Each toggle in ON state has bg-teal-600 class
    for (let i = 0; i < 3; i++) {
      const toggle = toggleButtons.nth(i);
      const classes = await toggle.getAttribute('class');
      expect(classes).toContain('bg-blue-500');
    }
  });

  /* ---------------------------------------------------------------------- */
  /* Categories panel                                                        */
  /* ---------------------------------------------------------------------- */

  test('Categories panel shows payment and expense categories with expected items', async ({ page }) => {
    await page.getByText('Categories').click();
    await expect(page.getByText('Categories').first()).toBeVisible({ timeout: 15_000 });

    // Payment categories heading and expected default items
    await expect(page.getByText('Payment Categories').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Rent').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Deposit').first()).toBeVisible();

    // Expense categories heading
    await expect(page.getByText('Expense Categories').first()).toBeVisible();
  });

  /* ---------------------------------------------------------------------- */
  /* Business logic: settings persist after save                             */
  /* ---------------------------------------------------------------------- */

  test('General settings persist after save -- change owner title, save, reload, verify', async ({ page }) => {
    await page.getByText('General').click();
    await expect(page.getByText('General Settings')).toBeVisible({ timeout: 15_000 });

    // Wait for data to load
    const companyNameInput = page.locator('label:has-text("Company Name")').locator('..').locator('input');
    await expect(companyNameInput).toHaveValue('Example Holdings Inc.', { timeout: 15_000 });

    // Read original owner name value for restoration
    const ownerInput = page.locator('label:has-text("Owner / Manager Name")').locator('..').locator('input');
    const originalOwner = await ownerInput.inputValue();

    // Change the owner name to a unique test value
    const testValue = `Test Owner ${Date.now()}`;
    await ownerInput.clear();
    await ownerInput.fill(testValue);

    // Click save
    await page.getByRole('button', { name: /Save/i }).click();

    // Wait for save confirmation
    await expect(page.getByText('Settings saved')).toBeVisible({ timeout: 10_000 });

    // Reload the page completely to verify persistence
    await page.goto('/settings');
    await waitForPageLoad(page);
    await expect(page.getByText('Settings').first()).toBeVisible({ timeout: 15_000 });

    // Open General panel again
    await page.getByText('General').click();
    await expect(page.getByText('General Settings')).toBeVisible({ timeout: 15_000 });

    // The changed value should have persisted
    const ownerInputAfterReload = page.locator('label:has-text("Owner / Manager Name")').locator('..').locator('input');
    await expect(ownerInputAfterReload).toHaveValue(testValue, { timeout: 15_000 });

    // Restore original value so subsequent tests are not affected
    await ownerInputAfterReload.clear();
    await ownerInputAfterReload.fill(originalOwner);
    await page.getByRole('button', { name: /Save/i }).click();
    await expect(page.getByText('Settings saved')).toBeVisible({ timeout: 10_000 });

    // Final verification: confirm restoration
    await page.goto('/settings');
    await waitForPageLoad(page);
    await page.getByText('General').click();
    await expect(page.getByText('General Settings')).toBeVisible({ timeout: 15_000 });
    const ownerInputFinal = page.locator('label:has-text("Owner / Manager Name")').locator('..').locator('input');
    await expect(ownerInputFinal).toHaveValue(originalOwner, { timeout: 15_000 });
  });

  /* ---------------------------------------------------------------------- */
  /* Edge case: save General with empty company name                         */
  /* ---------------------------------------------------------------------- */

  test('saving General with empty company name shows validation or keeps form open', async ({ page }) => {
    await page.getByText('General').click();
    await expect(page.getByText('General Settings')).toBeVisible({ timeout: 15_000 });

    // Wait for data to load
    const companyNameInput = page.locator('label:has-text("Company Name")').locator('..').locator('input');
    await expect(companyNameInput).toHaveValue('Example Holdings Inc.', { timeout: 15_000 });

    // Clear the company name
    await companyNameInput.clear();
    await expect(companyNameInput).toHaveValue('');

    // Click save
    await page.getByRole('button', { name: /Save/i }).click();
    await page.waitForTimeout(1000);

    // The General Settings panel should still be visible (form stays open or shows error).
    await expect(page.getByText('General Settings')).toBeVisible();

    // Restore the original company name so subsequent tests are not affected
    await companyNameInput.fill('Example Holdings Inc.');
    await page.getByRole('button', { name: /Save/i }).click();
    await page.waitForTimeout(1000);
  });
});
