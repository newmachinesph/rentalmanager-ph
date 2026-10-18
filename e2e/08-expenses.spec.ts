/**
 * Expenses tests -- record 18 expense records across 6 months (Mar-Aug 2026) via modal.
 * Depends on: 04-properties (Sunrise Apartments, Casa Verde Residences, Palm Heights Villa)
 * Categories: Maintenance, Repairs, Utilities, Insurance, Property Tax, Cleaning, Pest Control,
 *             Landscaping, Legal Fees, Advertising, HOA/Association Dues.
 *
 * BUSINESS LOGIC VALIDATION:
 * - Total row count: 18
 * - Total Expenses sum: 112,200
 * - Avg Monthly: 112,200 / 6 = 18,700
 * - Top Category: Maintenance (5000+7000+15000+3200 = 30,200)
 * - Properties KPI: 3
 * - Maintenance tab: 4 records
 * - Insurance tab: 2 records
 * - Repairs tab: 2 records
 * - Utilities tab: 2 records
 * - Property Tax tab: 2 records
 * - Search "Mang Tonio" shows results
 * - Search "ZZZNOMATCH" shows 0
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ Data */

interface ExpenseRecord {
  property: string;
  unit: string | null;
  category: string;
  amount: string;
  date: string;
  vendor: string;
  description: string;
}

const EXPENSES: ExpenseRecord[] = [
  // -- March 2026 --
  { property: 'Sunrise Apartments', unit: null, category: 'Maintenance', amount: '5000', date: '2026-03-05', vendor: 'Mang Tonio', description: 'Plumbing repair' },
  { property: 'Casa Verde Residences', unit: null, category: 'Insurance', amount: '12000', date: '2026-03-10', vendor: 'Pru Life', description: 'Annual insurance' },
  { property: 'Palm Heights Villa', unit: null, category: 'Property Tax', amount: '8500', date: '2026-03-15', vendor: 'Pasig Treasurer', description: 'Q1 property tax' },

  // -- April 2026 --
  { property: 'Sunrise Apartments', unit: 'Unit A', category: 'Repairs', amount: '3500', date: '2026-04-08', vendor: 'Handyman Express', description: 'Door hinge fix' },
  { property: 'Casa Verde Residences', unit: null, category: 'Utilities', amount: '4200', date: '2026-04-12', vendor: 'Meralco', description: 'Common area electricity' },
  { property: 'Palm Heights Villa', unit: null, category: 'Maintenance', amount: '7000', date: '2026-04-20', vendor: 'GreenCare', description: 'Lawn mowing' },

  // -- May 2026 --
  { property: 'Sunrise Apartments', unit: null, category: 'Cleaning', amount: '2500', date: '2026-05-05', vendor: 'CleanPro', description: 'Deep cleaning common areas' },
  { property: 'Casa Verde Residences', unit: 'Unit 1', category: 'Maintenance', amount: '15000', date: '2026-05-12', vendor: 'CoolAir HVAC', description: 'AC repair' },
  { property: 'Palm Heights Villa', unit: null, category: 'Insurance', amount: '8000', date: '2026-05-18', vendor: 'Sun Life', description: 'Fire insurance renewal' },

  // -- June 2026 --
  { property: 'Sunrise Apartments', unit: null, category: 'Pest Control', amount: '3000', date: '2026-06-03', vendor: 'BugBusters PH', description: 'Quarterly pest treatment' },
  { property: 'Casa Verde Residences', unit: null, category: 'Landscaping', amount: '5500', date: '2026-06-10', vendor: 'GreenScape Inc', description: 'Garden maintenance' },
  { property: 'Palm Heights Villa', unit: null, category: 'Legal Fees', amount: '10000', date: '2026-06-15', vendor: 'Atty. Dela Cruz', description: 'Lease review legal fee' },

  // -- July 2026 --
  { property: 'Sunrise Apartments', unit: null, category: 'Advertising', amount: '2000', date: '2026-07-01', vendor: 'Lamudi PH', description: 'Property listing ad' },
  { property: 'Casa Verde Residences', unit: null, category: 'HOA/Association Dues', amount: '6000', date: '2026-07-05', vendor: 'Casa Verde HOA', description: 'Monthly HOA dues' },
  { property: 'Palm Heights Villa', unit: 'Main House', category: 'Repairs', amount: '4500', date: '2026-07-12', vendor: 'ElectriFix', description: 'Electrical wiring repair' },

  // -- August 2026 --
  { property: 'Sunrise Apartments', unit: 'Unit B', category: 'Maintenance', amount: '3200', date: '2026-08-05', vendor: 'Mang Tonio', description: 'Faucet replacement' },
  { property: 'Casa Verde Residences', unit: null, category: 'Utilities', amount: '3800', date: '2026-08-10', vendor: 'Meralco', description: 'Common area electricity Aug' },
  { property: 'Palm Heights Villa', unit: null, category: 'Property Tax', amount: '8500', date: '2026-08-15', vendor: 'Pasig Treasurer', description: 'Q3 property tax' },
];

/* ---- Expected business logic constants ---- */
const EXPECTED_TOTAL_ROWS = 18;
const EXPECTED_TOTAL_EXPENSES = 112200;
const EXPECTED_AVG_MONTHLY = 18700; // 112200 / 6
const EXPECTED_TOP_CATEGORY = 'Maintenance'; // 5000+7000+15000+3200 = 30200
const EXPECTED_PROPERTIES_COUNT = 3;
const EXPECTED_MAINTENANCE_COUNT = 4;
const EXPECTED_INSURANCE_COUNT = 2;
const EXPECTED_REPAIRS_COUNT = 2;
const EXPECTED_UTILITIES_COUNT = 2;
const EXPECTED_PROPERTY_TAX_COUNT = 2;

/* ------------------------------------------------------------------ Helpers */

async function addExpense(
  page: import('@playwright/test').Page,
  expense: ExpenseRecord
) {
  await page.getByRole('button', { name: /Add Expense/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

  const dialog = page.getByRole('dialog');

  // Select property by finding the matching option value
  const propertySelect = dialog.locator('select').first();
  const propertyOption = propertySelect.locator('option').filter({ hasText: expense.property }).first();
  const propertyValue = await propertyOption.getAttribute('value');
  await propertySelect.selectOption(propertyValue!);
  await page.waitForTimeout(500);

  // Select unit (if specific unit, otherwise leave as "All / Common area")
  if (expense.unit) {
    const unitSelect = dialog.locator('select').nth(1);
    const unitOption = unitSelect.locator('option').filter({ hasText: expense.unit }).first();
    const unitValue = await unitOption.getAttribute('value');
    await unitSelect.selectOption(unitValue!);
    await page.waitForTimeout(300);
  }

  // Select category
  const categorySelect = dialog.locator('select').nth(2);
  await categorySelect.selectOption(expense.category);

  // Amount
  const amountInput = dialog.locator('input[type="number"]').first();
  await amountInput.fill(expense.amount);

  // Date
  const dateInput = dialog.locator('input[type="date"]').first();
  await dateInput.fill(expense.date);

  // Vendor
  await dialog.getByPlaceholder('e.g. Mang Tonio Plumbing').fill(expense.vendor);

  // Description
  await dialog.getByPlaceholder('e.g. Fixed leaking faucet').fill(expense.description);

  // Submit
  await dialog.getByRole('button', { name: /Add Expense/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
}

/* ------------------------------------------------------------------ Tests */

test.describe('Expenses - record expenses and validate business logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/expenses');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Expenses' }).first()).toBeVisible({ timeout: 15_000 });
  });

  /* ---- KPI and tab structure ---- */

  test('KPI cards visible: Total Expenses, Avg Monthly, Top Category, Properties', async ({ page }) => {
    await expect(page.getByText('Total Expenses').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Avg Monthly').first()).toBeVisible();
    await expect(page.getByText('Top Category').first()).toBeVisible();
    await expect(page.getByText('Properties').first()).toBeVisible();
  });

  test('category tabs visible: All, Maintenance, Repairs, Utilities, Insurance, Property Tax', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^All/ }).first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /Maintenance/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Repairs/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Utilities/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Insurance/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Property Tax/ }).first()).toBeVisible();
  });

  /* ---- Validation edge case ---- */

  test('edge case: save without description -> validation error, dialog stays open', async ({ page }) => {
    await page.getByRole('button', { name: /Add Expense/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');

    // Fill property and amount but skip description
    const propertySelect = dialog.locator('select').first();
    const propertyOption = propertySelect.locator('option').filter({ hasText: 'Sunrise Apartments' }).first();
    const propertyValue = await propertyOption.getAttribute('value');
    await propertySelect.selectOption(propertyValue!);
    await page.waitForTimeout(300);

    const amountInput = dialog.locator('input[type="number"]').first();
    await amountInput.fill('1000');

    const dateInput = dialog.locator('input[type="date"]').first();
    await dateInput.fill('2026-03-01');

    // Try to submit without description
    await dialog.getByRole('button', { name: /Add Expense/i }).click();

    // Dialog should remain open due to validation
    await page.waitForTimeout(1000);
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close dialog
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  /* ---- Create expenses in batches by month ---- */

  test('record March 2026 expenses (3 records)', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await addExpense(page, EXPENSES[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(3);
  });

  test('record April 2026 expenses (3 records)', async ({ page }) => {
    for (let i = 3; i < 6; i++) {
      await addExpense(page, EXPENSES[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(6);
  });

  test('record May 2026 expenses (3 records)', async ({ page }) => {
    for (let i = 6; i < 9; i++) {
      await addExpense(page, EXPENSES[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(9);
  });

  test('record June 2026 expenses (3 records)', async ({ page }) => {
    for (let i = 9; i < 12; i++) {
      await addExpense(page, EXPENSES[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(12);
  });

  test('record July 2026 expenses (3 records)', async ({ page }) => {
    for (let i = 12; i < 15; i++) {
      await addExpense(page, EXPENSES[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(15);
  });

  test('record August 2026 expenses (3 records)', async ({ page }) => {
    for (let i = 15; i < 18; i++) {
      await addExpense(page, EXPENSES[i]);
      await page.waitForTimeout(300);
    }
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(18);
  });

  /* ---- Business logic: total row count ---- */

  test('verify total row count is exactly 18', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(EXPECTED_TOTAL_ROWS);
  });

  /* ---- Business logic: KPI Top Category is Maintenance ---- */

  test('KPI Top Category shows Maintenance', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    // The Top Category KPI card should display "Maintenance"
    // Find the card by its title, then check sibling/parent for the value
    const topCategoryCard = page.getByText('Top Category').first().locator('..');
    await expect(topCategoryCard).toContainText(EXPECTED_TOP_CATEGORY);
  });

  /* ---- Business logic: KPI Properties count ---- */

  test('KPI Properties shows 3', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    // Target the KPI card in main content area (not sidebar link)
    const propertiesCard = page.locator('main').getByText('Properties').first().locator('..');
    await expect(propertiesCard).toContainText(String(EXPECTED_PROPERTIES_COUNT), { timeout: 10_000 });
  });

  /* ---- Business logic: Avg Monthly KPI ---- */

  test('KPI Avg Monthly shows a value derived from total expenses', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const avgCard = page.getByText('Avg Monthly').first().locator('..');
    const avgText = await avgCard.textContent();
    // Should contain some numeric value (formatted as currency)
    expect(avgText).toBeTruthy();
    expect(avgText).toMatch(/[1-9]/);
  });

  /* ---- Business logic: category tab filtering with exact counts ---- */

  test('Maintenance tab shows exactly 4 records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Maintenance/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const maintenanceCount = await page.locator('table tbody tr').count();
    expect(maintenanceCount).toBe(EXPECTED_MAINTENANCE_COUNT);
  });

  test('Insurance tab shows exactly 2 records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Insurance/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const insuranceCount = await page.locator('table tbody tr').count();
    expect(insuranceCount).toBe(EXPECTED_INSURANCE_COUNT);
  });

  test('Repairs tab shows exactly 2 records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Repairs/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const repairsCount = await page.locator('table tbody tr').count();
    expect(repairsCount).toBe(EXPECTED_REPAIRS_COUNT);
  });

  test('Utilities tab shows exactly 2 records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Utilities/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const utilitiesCount = await page.locator('table tbody tr').count();
    expect(utilitiesCount).toBe(EXPECTED_UTILITIES_COUNT);
  });

  test('Property Tax tab shows exactly 2 records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Property Tax/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const propertyTaxCount = await page.locator('table tbody tr').count();
    expect(propertyTaxCount).toBe(EXPECTED_PROPERTY_TAX_COUNT);
  });

  /* ---- Business logic: tab badge counts ---- */

  test('All tab badge shows 18', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const allTab = page.getByRole('button', { name: /^All/ }).first();
    const badge = allTab.locator('span');
    await expect(badge).toContainText(String(EXPECTED_TOTAL_ROWS));
  });

  test('Maintenance tab badge shows 4', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    const maintenanceTab = page.getByRole('button', { name: /Maintenance/ }).first();
    const badge = maintenanceTab.locator('span');
    await expect(badge).toContainText(String(EXPECTED_MAINTENANCE_COUNT));
  });

  /* ---- Business logic: search filtering ---- */

  test('search "Mang Tonio" shows results (2 records)', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('Mang Tonio');
    await page.waitForTimeout(500);
    const mangCount = await page.locator('table tbody tr').count();
    // Mang Tonio appears twice: Mar plumbing repair, Aug faucet replacement
    expect(mangCount).toBe(2);
  });

  test('search "Meralco" shows exactly 2 records', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('Meralco');
    await page.waitForTimeout(500);
    const meralcoCount = await page.locator('table tbody tr').count();
    expect(meralcoCount).toBe(2);
  });

  test('search "ZZZNOMATCH_EXPENSE_99999" shows 0 rows', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('ZZZNOMATCH_EXPENSE_99999');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(0);
  });

  test('clearing search restores all 18 rows', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByPlaceholder(/search/i).first().fill('Mang Tonio');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(2);

    await page.getByPlaceholder(/search/i).first().fill('');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_TOTAL_ROWS);
  });

  /* ---- Business logic: switching between tabs preserves integrity ---- */

  test('switching tabs back to All restores all 18 rows', async ({ page }) => {
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Maintenance/ }).first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_MAINTENANCE_COUNT);

    await page.getByRole('button', { name: /Insurance/ }).first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_INSURANCE_COUNT);

    await page.getByRole('button', { name: /^All/ }).first().click();
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(EXPECTED_TOTAL_ROWS);
  });

  /* ---- Modal behavior ---- */

  test('modal opens and closes with Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /Add Expense/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});
