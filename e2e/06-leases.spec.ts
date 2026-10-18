/**
 * Leases tests -- create 5 leases linking tenants to property units via modal dialog,
 * then validate business logic: correct counts, Active status, KPI values (Active Leases = 5,
 * Monthly Revenue = 112,000), tab filtering, search, validation errors, and unit occupancy.
 *
 * Depends on: 04-properties (Sunrise Apartments, Casa Verde Residences, Palm Heights Villa)
 *             05-tenants (Maria Santos, Carlos Reyes, Ana Mendoza, Roberto Cruz, Elena Garcia)
 *
 * Leases created (Mar-Aug 2026):
 * 1. Maria Santos -> Sunrise/Unit A (15000, deposit 30000, due day 1)
 * 2. Carlos Reyes -> Sunrise/Unit B (22000, deposit 44000, due day 5)
 * 3. Ana Mendoza -> Casa Verde/Unit 1 (12000, deposit 24000, due day 1)
 * 4. Roberto Cruz -> Casa Verde/Unit 2 (18000, deposit 36000, due day 1, Apr-Sep)
 * 5. Elena Garcia -> Palm Heights/Main House (45000, deposit 90000, due day 1)
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ Data */

const LEASES = [
  {
    tenant: 'Maria Santos',
    property: 'Sunrise Apartments',
    unit: 'Unit A',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    rent: '15000',
    deposit: '30000',
    advance: '15000',
    dueDay: '1',
    status: 'Active',
  },
  {
    tenant: 'Carlos Reyes',
    property: 'Sunrise Apartments',
    unit: 'Unit B',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    rent: '22000',
    deposit: '44000',
    advance: '22000',
    dueDay: '5',
    status: 'Active',
  },
  {
    tenant: 'Ana Mendoza',
    property: 'Casa Verde Residences',
    unit: 'Unit 1',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    rent: '12000',
    deposit: '24000',
    advance: '12000',
    dueDay: '1',
    status: 'Active',
  },
  {
    tenant: 'Roberto Cruz',
    property: 'Casa Verde Residences',
    unit: 'Unit 2',
    startDate: '2026-04-01',
    endDate: '2026-09-30',
    rent: '18000',
    deposit: '36000',
    advance: '18000',
    dueDay: '1',
    status: 'Active',
  },
  {
    tenant: 'Elena Garcia',
    property: 'Palm Heights Villa',
    unit: 'Main House',
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    rent: '45000',
    deposit: '90000',
    advance: '45000',
    dueDay: '1',
    status: 'Active',
  },
];

/* ------------------------------------------------------------------ Helpers */

async function createLease(
  page: import('@playwright/test').Page,
  lease: (typeof LEASES)[number]
) {
  await page.getByRole('button', { name: /New Lease/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

  const dialog = page.getByRole('dialog');

  // Select property by finding the matching option value
  const propertySelect = dialog.locator('select').first();
  const propertyOption = propertySelect.locator('option').filter({ hasText: lease.property }).first();
  const propertyValue = await propertyOption.getAttribute('value');
  await propertySelect.selectOption(propertyValue!);
  await page.waitForTimeout(500);

  // Select unit (options may contain rent info like "Unit A -- PHP 15,000/mo")
  const unitSelect = dialog.locator('select').nth(1);
  const unitOption = unitSelect.locator('option').filter({ hasText: lease.unit }).first();
  const unitValue = await unitOption.getAttribute('value');
  await unitSelect.selectOption(unitValue!);
  await page.waitForTimeout(300);

  // Select tenant
  const tenantSelect = dialog.locator('select').nth(2);
  const tenantOption = tenantSelect.locator('option').filter({ hasText: lease.tenant }).first();
  const tenantValue = await tenantOption.getAttribute('value');
  await tenantSelect.selectOption(tenantValue!);

  // Start date and end date
  const dateInputs = dialog.locator('input[type="date"]');
  await dateInputs.nth(0).fill(lease.startDate);
  await dateInputs.nth(1).fill(lease.endDate);

  // Monthly rent (may be auto-filled from unit)
  const rentInput = dialog.locator('input[type="number"]').first();
  await rentInput.fill('');
  await rentInput.fill(lease.rent);

  // Security deposit
  const depositInput = dialog.locator('input[type="number"]').nth(1);
  await depositInput.fill(lease.deposit);

  // Advance payment
  const advanceInput = dialog.locator('input[type="number"]').nth(2);
  await advanceInput.fill(lease.advance);

  // Payment due day
  const dueDayInput = dialog.locator('input[type="number"]').nth(3);
  await dueDayInput.fill('');
  await dueDayInput.fill(lease.dueDay);

  // Status
  const statusSelect = dialog.locator('select').nth(3);
  await statusSelect.selectOption(lease.status);

  // Submit
  await dialog.getByRole('button', { name: /^Save$/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ Tests: Creation */

test.describe('Leases - create leases through UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leases');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Leases' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('edge case: save without selecting property -> validation error, dialog stays open', async ({ page }) => {
    await page.getByRole('button', { name: /New Lease/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Save$/i }).click();

    // Dialog should stay open due to validation -- proves required field enforcement
    await page.waitForTimeout(1000);
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close dialog
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  for (const lease of LEASES) {
    test(`create lease: ${lease.tenant} -> ${lease.property} / ${lease.unit}`, async ({ page }) => {
      await createLease(page, lease);

      // Verify lease appears in the table with the tenant name
      await page.waitForTimeout(500);
      await expect(page.getByText(lease.tenant).first()).toBeVisible({ timeout: 10_000 });

      // Verify the property name appears in the row
      await expect(page.getByText(lease.property).first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

/* ------------------------------------------------------------------ Tests: Business Logic */

test.describe('Leases - Business logic validation after creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leases');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Leases' }).first()).toBeVisible({ timeout: 15_000 });
    // Wait for table data to load
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('all 5 leases visible in table with correct tenant names', async ({ page }) => {
    const tenantNames = ['Maria Santos', 'Carlos Reyes', 'Ana Mendoza', 'Roberto Cruz', 'Elena Garcia'];
    for (const name of tenantNames) {
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    }

    // Verify row count is at least 5
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(5);
  });

  test('all 5 leases have Active status', async ({ page }) => {
    // Each lease row should show "Active" status badge
    const activeStatuses = page.locator('table tbody tr').getByText('Active');
    const activeCount = await activeStatuses.count();
    expect(activeCount).toBeGreaterThanOrEqual(5);
  });

  test('KPI "Active Leases" shows exactly 5', async ({ page }) => {
    await expect(page.getByText('Active Leases').first()).toBeVisible({ timeout: 15_000 });

    // Find the KPI card for Active Leases and verify its value is 5
    const activeKpi = page.getByText('Active Leases').first().locator('..');
    await expect(activeKpi.getByText('5').first()).toBeVisible({ timeout: 10_000 });
  });

  test('KPI "Monthly Revenue" shows 112,000 (sum of all rents)', async ({ page }) => {
    // Monthly revenue = 15000 + 22000 + 12000 + 18000 + 45000 = 112,000
    await expect(page.getByText('Monthly Revenue').first()).toBeVisible({ timeout: 15_000 });

    // The formatted value should be 112,000
    await expect(page.getByText('112,000').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Active tab shows 5 leases, Expired tab shows 0', async ({ page }) => {
    // Click Active tab
    await page.getByRole('button', { name: /Active/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    const activeRows = await page.locator('table tbody tr').count();
    expect(activeRows).toBeGreaterThanOrEqual(5);

    // Click Expired tab -- should have 0 leases
    await page.getByRole('button', { name: /Expired/ }).first().click();
    await page.waitForTimeout(500);

    const expiredRows = await page.locator('table tbody tr').count();
    expect(expiredRows).toBe(0);

    // Go back to All
    await page.getByRole('button', { name: /^All/ }).first().click();
    await page.waitForTimeout(500);
  });

  test('search by tenant name "Maria" finds Maria Santos lease', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Maria');
    await page.waitForTimeout(500);

    await expect(page.getByText('Maria Santos').first()).toBeVisible();
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

    // Other tenants should not be visible
    await expect(page.getByText('Carlos Reyes')).not.toBeVisible();
    await expect(page.getByText('Elena Garcia')).not.toBeVisible();
  });

  test('search "ZZZNOMATCH_LEASE_99999" shows no results', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('ZZZNOMATCH_LEASE_99999');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(0);
  });

  test('search by property name "Palm Heights" finds Elena Garcia lease', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Palm Heights');
    await page.waitForTimeout(500);

    await expect(page.getByText('Elena Garcia').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Palm Heights Villa').first()).toBeVisible({ timeout: 10_000 });
  });
});

/* ------------------------------------------------------------------ Tests: Unit Occupancy */

test.describe('Leases - Unit status changes to Occupied after lease creation', () => {
  test('Sunrise Apartments units show Occupied (not Vacant) after leases', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible({ timeout: 15_000 });

    await page.getByText('Sunrise Apartments').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Both Unit A and Unit B should now be Occupied
    await expect(page.getByText('Unit A').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Unit B').first()).toBeVisible({ timeout: 10_000 });

    // Verify Occupied status appears (units are no longer Vacant)
    const occupiedBadges = page.getByText('Occupied');
    const occupiedCount = await occupiedBadges.count();
    expect(occupiedCount).toBeGreaterThanOrEqual(2);
  });

  test('Casa Verde Residences units show Occupied after leases', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await page.getByText('Casa Verde Residences').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    await expect(page.getByText('Unit 1').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Unit 2').first()).toBeVisible({ timeout: 10_000 });

    // Both units should be Occupied
    const occupiedBadges = page.getByText('Occupied');
    const occupiedCount = await occupiedBadges.count();
    expect(occupiedCount).toBeGreaterThanOrEqual(2);
  });

  test('Palm Heights Villa Main House shows Occupied after lease', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await page.getByText('Palm Heights Villa').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    await expect(page.getByText('Main House').first()).toBeVisible({ timeout: 15_000 });

    // Main House should be Occupied
    await expect(page.getByText('Occupied').first()).toBeVisible({ timeout: 10_000 });
  });
});
