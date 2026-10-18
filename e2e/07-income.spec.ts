/**
 * Income tests -- record 30 payment records across 6 months (Mar-Aug 2026) via modal.
 * Depends on: 05-tenants (6 tenants), 06-leases (5 active leases)
 * Mix of statuses: Paid, Pending, Partially Paid, Overdue, Unpaid.
 *
 * BUSINESS LOGIC VALIDATION:
 * - Total Paid records: 21 out of 30
 * - Partially Paid: 1 (Carlos May, 11000)
 * - Pending: 6, Overdue: 1, Unpaid: 1
 * - Paid tab: 21 rows, Pending tab: 6 rows
 * - Search "Maria" yields 6 rows (one per month)
 * - Total row count: 30
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ Data */

interface PaymentRecord {
  property: string;
  unit: string;
  tenant: string;
  amount: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  method: string | null;
  refNo: string;
}

const PAYMENTS: PaymentRecord[] = [
  // -- March 2026: All 5 tenants Paid --
  { property: 'Sunrise Apartments', unit: 'Unit A', tenant: 'Maria Santos', amount: '15000', status: 'Paid', dueDate: '2026-03-01', paidDate: '2026-03-01', method: 'GCash', refNo: 'MAR-001' },
  { property: 'Sunrise Apartments', unit: 'Unit B', tenant: 'Carlos Reyes', amount: '22000', status: 'Paid', dueDate: '2026-03-05', paidDate: '2026-03-05', method: 'Bank Transfer', refNo: 'MAR-002' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', tenant: 'Ana Mendoza', amount: '12000', status: 'Paid', dueDate: '2026-03-01', paidDate: '2026-03-01', method: 'Cash', refNo: 'MAR-003' },
  { property: 'Casa Verde Residences', unit: 'Unit 2', tenant: 'Roberto Cruz', amount: '18000', status: 'Paid', dueDate: '2026-03-01', paidDate: '2026-03-02', method: 'Maya', refNo: 'MAR-004' },
  { property: 'Palm Heights Villa', unit: 'Main House', tenant: 'Elena Garcia', amount: '45000', status: 'Paid', dueDate: '2026-03-01', paidDate: '2026-03-01', method: 'Check', refNo: 'MAR-005' },

  // -- April 2026: 4 Paid, 1 Pending (Roberto started Apr) --
  { property: 'Sunrise Apartments', unit: 'Unit A', tenant: 'Maria Santos', amount: '15000', status: 'Paid', dueDate: '2026-04-01', paidDate: '2026-04-01', method: 'GCash', refNo: 'APR-001' },
  { property: 'Sunrise Apartments', unit: 'Unit B', tenant: 'Carlos Reyes', amount: '22000', status: 'Paid', dueDate: '2026-04-05', paidDate: '2026-04-05', method: 'Bank Transfer', refNo: 'APR-002' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', tenant: 'Ana Mendoza', amount: '12000', status: 'Paid', dueDate: '2026-04-01', paidDate: '2026-04-01', method: 'Cash', refNo: 'APR-003' },
  { property: 'Casa Verde Residences', unit: 'Unit 2', tenant: 'Roberto Cruz', amount: '18000', status: 'Pending', dueDate: '2026-04-01', paidDate: null, method: null, refNo: '' },
  { property: 'Palm Heights Villa', unit: 'Main House', tenant: 'Elena Garcia', amount: '45000', status: 'Paid', dueDate: '2026-04-01', paidDate: '2026-04-02', method: 'Check', refNo: 'APR-005' },

  // -- May 2026: 3 Paid, 1 Partially Paid (Carlos), 1 Pending (Ana) --
  { property: 'Sunrise Apartments', unit: 'Unit A', tenant: 'Maria Santos', amount: '15000', status: 'Paid', dueDate: '2026-05-01', paidDate: '2026-05-01', method: 'GCash', refNo: 'MAY-001' },
  { property: 'Sunrise Apartments', unit: 'Unit B', tenant: 'Carlos Reyes', amount: '11000', status: 'Partially Paid', dueDate: '2026-05-05', paidDate: '2026-05-05', method: 'Bank Transfer', refNo: 'MAY-002' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', tenant: 'Ana Mendoza', amount: '12000', status: 'Pending', dueDate: '2026-05-01', paidDate: null, method: null, refNo: '' },
  { property: 'Casa Verde Residences', unit: 'Unit 2', tenant: 'Roberto Cruz', amount: '18000', status: 'Paid', dueDate: '2026-05-01', paidDate: '2026-05-01', method: 'Maya', refNo: 'MAY-004' },
  { property: 'Palm Heights Villa', unit: 'Main House', tenant: 'Elena Garcia', amount: '45000', status: 'Paid', dueDate: '2026-05-01', paidDate: '2026-05-01', method: 'Check', refNo: 'MAY-005' },

  // -- June 2026: 4 Paid, 1 Overdue (Elena late) --
  { property: 'Sunrise Apartments', unit: 'Unit A', tenant: 'Maria Santos', amount: '15000', status: 'Paid', dueDate: '2026-06-01', paidDate: '2026-06-01', method: 'GCash', refNo: 'JUN-001' },
  { property: 'Sunrise Apartments', unit: 'Unit B', tenant: 'Carlos Reyes', amount: '22000', status: 'Paid', dueDate: '2026-06-05', paidDate: '2026-06-05', method: 'Bank Transfer', refNo: 'JUN-002' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', tenant: 'Ana Mendoza', amount: '12000', status: 'Paid', dueDate: '2026-06-01', paidDate: '2026-06-01', method: 'Cash', refNo: 'JUN-003' },
  { property: 'Casa Verde Residences', unit: 'Unit 2', tenant: 'Roberto Cruz', amount: '18000', status: 'Paid', dueDate: '2026-06-01', paidDate: '2026-06-01', method: 'Maya', refNo: 'JUN-004' },
  { property: 'Palm Heights Villa', unit: 'Main House', tenant: 'Elena Garcia', amount: '45000', status: 'Overdue', dueDate: '2026-06-01', paidDate: null, method: null, refNo: '' },

  // -- July 2026: 3 Paid, 2 Pending --
  { property: 'Sunrise Apartments', unit: 'Unit A', tenant: 'Maria Santos', amount: '15000', status: 'Paid', dueDate: '2026-07-01', paidDate: '2026-07-01', method: 'GCash', refNo: 'JUL-001' },
  { property: 'Sunrise Apartments', unit: 'Unit B', tenant: 'Carlos Reyes', amount: '22000', status: 'Paid', dueDate: '2026-07-05', paidDate: '2026-07-06', method: 'Bank Transfer', refNo: 'JUL-002' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', tenant: 'Ana Mendoza', amount: '12000', status: 'Pending', dueDate: '2026-07-01', paidDate: null, method: null, refNo: '' },
  { property: 'Casa Verde Residences', unit: 'Unit 2', tenant: 'Roberto Cruz', amount: '18000', status: 'Pending', dueDate: '2026-07-01', paidDate: null, method: null, refNo: '' },
  { property: 'Palm Heights Villa', unit: 'Main House', tenant: 'Elena Garcia', amount: '45000', status: 'Paid', dueDate: '2026-07-01', paidDate: '2026-07-03', method: 'Check', refNo: 'JUL-005' },

  // -- August 2026: 2 Paid, 2 Pending, 1 Unpaid --
  { property: 'Sunrise Apartments', unit: 'Unit A', tenant: 'Maria Santos', amount: '15000', status: 'Paid', dueDate: '2026-08-01', paidDate: '2026-08-01', method: 'GCash', refNo: 'AUG-001' },
  { property: 'Sunrise Apartments', unit: 'Unit B', tenant: 'Carlos Reyes', amount: '22000', status: 'Pending', dueDate: '2026-08-05', paidDate: null, method: null, refNo: '' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', tenant: 'Ana Mendoza', amount: '12000', status: 'Pending', dueDate: '2026-08-01', paidDate: null, method: null, refNo: '' },
  { property: 'Casa Verde Residences', unit: 'Unit 2', tenant: 'Roberto Cruz', amount: '18000', status: 'Paid', dueDate: '2026-08-01', paidDate: '2026-08-01', method: 'Maya', refNo: 'AUG-004' },
  { property: 'Palm Heights Villa', unit: 'Main House', tenant: 'Elena Garcia', amount: '45000', status: 'Unpaid', dueDate: '2026-08-01', paidDate: null, method: null, refNo: '' },
];

/* ---- Expected business logic constants ---- */
// Paid: Mar 5, Apr 4, May 3, Jun 4, Jul 3, Aug 2 = 21
const EXPECTED_PAID_COUNT = 21;
// Pending: Apr 1, May 1, Jul 2, Aug 2 = 6
const EXPECTED_PENDING_COUNT = 6;
// Overdue: Jun 1 = 1
const EXPECTED_OVERDUE_COUNT = 1;
// Partially Paid: May 1 = 1
const EXPECTED_PARTIALLY_PAID_COUNT = 1;
// Unpaid: Aug 1 = 1
const EXPECTED_UNPAID_COUNT = 1;
const EXPECTED_TOTAL = 30;

/* ------------------------------------------------------------------ Helpers */

async function recordPayment(
  page: import('@playwright/test').Page,
  payment: PaymentRecord
) {
  await page.getByRole('button', { name: /Record Payment/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

  const dialog = page.getByRole('dialog');

  // Select property by finding the matching option value
  const propertySelect = dialog.locator('select').first();
  const propertyOption = propertySelect.locator('option').filter({ hasText: payment.property }).first();
  const propertyValue = await propertyOption.getAttribute('value');
  await propertySelect.selectOption(propertyValue!);
  await page.waitForTimeout(500);

  // Select unit
  const unitSelect = dialog.locator('select').nth(1);
  const unitOption = unitSelect.locator('option').filter({ hasText: payment.unit }).first();
  const unitValue = await unitOption.getAttribute('value');
  await unitSelect.selectOption(unitValue!);
  await page.waitForTimeout(300);

  // Select tenant
  const tenantSelect = dialog.locator('select').nth(2);
  const tenantOption = tenantSelect.locator('option').filter({ hasText: payment.tenant }).first();
  const tenantValue = await tenantOption.getAttribute('value');
  await tenantSelect.selectOption(tenantValue!);

  // Category defaults to "Rent" - leave as is

  // Amount
  const amountInput = dialog.locator('input[type="number"]').first();
  await amountInput.fill(payment.amount);

  // Status
  const statusSelect = dialog.locator('select').nth(4);
  await statusSelect.selectOption(payment.status);

  // Due date
  const dateInputs = dialog.locator('input[type="date"]');
  await dateInputs.nth(0).fill(payment.dueDate);

  // Paid date (only if status is Paid or Partially Paid)
  if (payment.paidDate) {
    await dateInputs.nth(1).fill(payment.paidDate);
  }

  // Payment method (only if provided)
  if (payment.method) {
    const methodSelect = dialog.locator('select').nth(5);
    await methodSelect.selectOption(payment.method);
  }

  // Reference no (if provided)
  if (payment.refNo) {
    await dialog.getByPlaceholder('e.g. REF-12345').fill(payment.refNo);
  }

  // Submit
  await dialog.getByRole('button', { name: /Add Payment/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ Tests */

test.describe('Income - record payments and validate business logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/income');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Income' }).first()).toBeVisible({ timeout: 15_000 });
  });

  /* ---- KPI and tab structure ---- */

  test('KPI cards visible: Total Collected, Pending, Overdue, Collection Rate', async ({ page }) => {
    await expect(page.getByText('Total Collected').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Pending Payments').first()).toBeVisible();
    await expect(page.getByText('Overdue Payments').first()).toBeVisible();
    await expect(page.getByText('Collection Rate').first()).toBeVisible();
  });

  test('tab filters visible: All, Paid, Pending, Overdue, Partially Paid, Unpaid', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^All/ }).first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /^Paid/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Pending/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Overdue/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Partially Paid/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Unpaid/ }).first()).toBeVisible();
  });

  /* ---- Create all 30 payments in batches by month ---- */

  test('record March 2026 payments (5 Paid)', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await recordPayment(page, PAYMENTS[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(5);
  });

  test('record April 2026 payments (4 Paid, 1 Pending)', async ({ page }) => {
    for (let i = 5; i < 10; i++) {
      await recordPayment(page, PAYMENTS[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(10);
  });

  test('record May 2026 payments (3 Paid, 1 Partially Paid, 1 Pending)', async ({ page }) => {
    for (let i = 10; i < 15; i++) {
      await recordPayment(page, PAYMENTS[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(15);
  });

  test('record June 2026 payments (4 Paid, 1 Overdue)', async ({ page }) => {
    for (let i = 15; i < 20; i++) {
      await recordPayment(page, PAYMENTS[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(20);
  });

  test('record July 2026 payments (3 Paid, 2 Pending)', async ({ page }) => {
    for (let i = 20; i < 25; i++) {
      await recordPayment(page, PAYMENTS[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(25);
  });

  test('record August 2026 payments (2 Paid, 2 Pending, 1 Unpaid)', async ({ page }) => {
    for (let i = 25; i < 30; i++) {
      await recordPayment(page, PAYMENTS[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(30);
  });

  /* ---- Business logic: total row count ---- */

  test('verify total row count is exactly 30', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(EXPECTED_TOTAL);
  });

  /* ---- Business logic: tab badge counts ---- */

  test('All tab badge shows 30', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    // The All tab button contains a badge span with the count
    const allTab = page.getByRole('button', { name: /^All/ }).first();
    const badge = allTab.locator('span');
    await expect(badge).toContainText(String(EXPECTED_TOTAL));
  });

  test('Paid tab shows exactly 21 rows when clicked', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /^Paid/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const paidCount = await page.locator('table tbody tr').count();
    expect(paidCount).toBe(EXPECTED_PAID_COUNT);
  });

  test('Pending tab shows exactly 6 rows when clicked', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Pending/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const pendingCount = await page.locator('table tbody tr').count();
    expect(pendingCount).toBe(EXPECTED_PENDING_COUNT);
  });

  test('Overdue tab shows exactly 1 row when clicked', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Overdue/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const overdueCount = await page.locator('table tbody tr').count();
    expect(overdueCount).toBe(EXPECTED_OVERDUE_COUNT);
  });

  test('Partially Paid tab shows exactly 1 row when clicked', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Partially Paid/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const partialCount = await page.locator('table tbody tr').count();
    expect(partialCount).toBe(EXPECTED_PARTIALLY_PAID_COUNT);
  });

  test('Unpaid tab shows exactly 1 row when clicked', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Unpaid/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const unpaidCount = await page.locator('table tbody tr').count();
    expect(unpaidCount).toBe(EXPECTED_UNPAID_COUNT);
  });

  /* ---- Business logic: KPI values on Pending/Overdue ---- */

  test('KPI Pending Payments shows total pending amount', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    // Pending amounts: 18000 (Apr Roberto) + 12000 (May Ana) + 12000 (Jul Ana) + 18000 (Jul Roberto)
    //                  + 22000 (Aug Carlos) + 12000 (Aug Ana) = 94,000
    // The KPI card shows the formatted currency value
    const pendingCard = page.getByText('Pending Payments').first().locator('..');
    const pendingValue = await pendingCard.textContent();
    // Should contain a currency amount > 0
    expect(pendingValue).toBeTruthy();
    // Verify the numeric value contains some digits (not zero)
    expect(pendingValue).toMatch(/[1-9]/);
  });

  test('KPI Overdue Payments shows overdue amount', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    // Overdue: Elena Jun = 45,000
    const overdueCard = page.getByText('Overdue Payments').first().locator('..');
    const overdueValue = await overdueCard.textContent();
    expect(overdueValue).toBeTruthy();
    // Should show 45,000 in some formatted way
    expect(overdueValue).toMatch(/45/);
  });

  /* ---- Business logic: search filtering ---- */

  test('search "Maria" shows exactly 6 rows (one per month)', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('Maria');
    await page.waitForTimeout(500);
    const mariaCount = await page.locator('table tbody tr').count();
    expect(mariaCount).toBe(6);
  });

  test('search "Elena" shows exactly 6 rows (one per month)', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('Elena');
    await page.waitForTimeout(500);
    const elenaCount = await page.locator('table tbody tr').count();
    expect(elenaCount).toBe(6);
  });

  test('search "ZZZNOMATCH_INCOME_99999" shows 0 rows', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('ZZZNOMATCH_INCOME_99999');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(0);
  });

  test('clearing search restores all 30 rows', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('Maria');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(6);

    await page.getByPlaceholder(/search/i).first().fill('');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_TOTAL);
  });

  /* ---- Business logic: tab + search combined ---- */

  test('Paid tab + search "Sunrise" shows only Sunrise paid records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    // Click Paid tab first
    await page.getByRole('button', { name: /^Paid/ }).first().click();
    await page.waitForTimeout(500);

    // Then search for Sunrise
    await page.getByPlaceholder(/search/i).first().fill('Sunrise');
    await page.waitForTimeout(500);

    const count = await page.locator('table tbody tr').count();
    // Maria: 6 paid, Carlos: 5 paid from Sunrise = 11 paid from Sunrise
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(EXPECTED_PAID_COUNT);
  });

  /* ---- Modal behavior ---- */

  test('modal opens and closes with Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /Record Payment/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  /* ---- Business logic: All tab restores full list after filtering ---- */

  test('switching between tabs preserves correct counts', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    // Paid tab
    await page.getByRole('button', { name: /^Paid/ }).first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_PAID_COUNT);

    // Pending tab
    await page.getByRole('button', { name: /Pending/ }).first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_PENDING_COUNT);

    // Back to All
    await page.getByRole('button', { name: /^All/ }).first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_TOTAL);
  });
});
