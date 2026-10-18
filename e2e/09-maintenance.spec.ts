/**
 * Maintenance -- create 6 maintenance requests through the UI,
 * verify Kanban board columns, Table view toggle, modal behaviour,
 * and business logic validation (counts, priorities, costs).
 *
 * BUSINESS LOGIC VALIDATION:
 * - Kanban NEW column: 3 cards (Open status)
 * - Kanban IN PROGRESS column: 2 cards
 * - Kanban COMPLETED column: 1 card
 * - Table view: 6 rows total
 * - High priority requests: 3
 * - Completed request shows actual cost
 * - Cancel closes modal without saving
 * - Save with empty title is disabled
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ */
/*  Helper: fill and submit a maintenance request via the modal       */
/* ------------------------------------------------------------------ */

interface MaintenanceEntry {
  title: string;
  property: string;
  unit: string;
  priority: string;
  category: string;
  status: string;
  description: string;
  estCost?: number;
  actualCost?: number;
  contractor?: string;
}

async function createMaintenanceRequest(page: import('@playwright/test').Page, entry: MaintenanceEntry) {
  // Open the modal
  await page.getByRole('button', { name: /New request/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
  const dialog = page.getByRole('dialog');

  // Title -- inline input with placeholder "Enter title"
  await dialog.getByPlaceholder('Enter title').fill(entry.title);
  await page.waitForTimeout(300);

  // Property -- select (inline row, not FormField)
  const propertySelect = dialog.locator('span:has-text("Property")').locator('..').locator('select');
  const propertyOption = propertySelect.locator('option').filter({ hasText: entry.property }).first();
  const propertyValue = await propertyOption.getAttribute('value');
  await propertySelect.selectOption(propertyValue!);
  await page.waitForTimeout(500);

  // Unit -- select (appears after property is chosen)
  const unitSelect = dialog.locator('span:has-text("Unit")').locator('..').locator('select');
  const unitOption = unitSelect.locator('option').filter({ hasText: entry.unit }).first();
  const unitValue = await unitOption.getAttribute('value');
  await unitSelect.selectOption(unitValue!);
  await page.waitForTimeout(300);

  // Status -- select (Open shows as "New", "In Progress", "Completed")
  if (entry.status !== 'Open') {
    const statusSelect = dialog.locator('span:has-text("Status")').locator('..').locator('select');
    await statusSelect.selectOption(entry.status);
    await page.waitForTimeout(300);
  }

  // Priority -- select (values are Low, Medium, High, Urgent; displayed uppercase)
  const prioritySelect = dialog.locator('span:has-text("Priority")').locator('..').locator('select');
  await prioritySelect.selectOption(entry.priority);
  await page.waitForTimeout(300);

  // Category -- select
  const categorySelect = dialog.locator('span:has-text("Category")').locator('..').locator('select');
  await categorySelect.selectOption(entry.category);
  await page.waitForTimeout(300);

  // Contractor (optional)
  if (entry.contractor) {
    const contractorInput = dialog.getByPlaceholder('Contractor name');
    await contractorInput.fill(entry.contractor);
    await page.waitForTimeout(300);
  }

  // Est. Cost (optional)
  if (entry.estCost != null) {
    const estCostInput = dialog.locator('span:has-text("Est. Cost")').locator('..').locator('input[type="number"]');
    await estCostInput.fill(String(entry.estCost));
    await page.waitForTimeout(300);
  }

  // Actual Cost (optional)
  if (entry.actualCost != null) {
    const actualCostInput = dialog.locator('span:has-text("Actual")').locator('..').locator('input[type="number"]');
    await actualCostInput.fill(String(entry.actualCost));
    await page.waitForTimeout(300);
  }

  // Description -- textarea
  const textarea = dialog.locator('textarea').first();
  await textarea.fill(entry.description);
  await page.waitForTimeout(300);

  // Submit
  await dialog.getByRole('button', { name: /^Save$/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(500);
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const REQUESTS: MaintenanceEntry[] = [
  {
    title: 'Leaking pipe in bathroom',
    property: 'Sunrise Apartments',
    unit: 'Unit A',
    priority: 'High',
    category: 'Plumbing',
    status: 'Open',
    description: 'Water dripping from ceiling pipe',
    estCost: 4000,
  },
  {
    title: 'AC not cooling properly',
    property: 'Casa Verde',
    unit: 'Unit 1',
    priority: 'Medium',
    category: 'HVAC',
    status: 'In Progress',
    description: 'Split-type AC blowing warm air',
    estCost: 12000,
    contractor: 'CoolAir HVAC',
  },
  {
    title: 'Paint peeling on wall',
    property: 'Palm Heights',
    unit: 'Main House',
    priority: 'Low',
    category: 'Painting',
    status: 'Open',
    description: 'Front entrance paint peeling',
    estCost: 8000,
  },
  {
    title: 'Broken door lock',
    property: 'Sunrise Apartments',
    unit: 'Unit B',
    priority: 'High',
    category: 'Other',
    status: 'Open',
    description: 'Lock mechanism jammed',
  },
  {
    title: 'Electrical outlet sparking',
    property: 'Casa Verde',
    unit: 'Unit 2',
    priority: 'High',
    category: 'Electrical',
    status: 'In Progress',
    description: 'Outlet near kitchen sparking',
    contractor: 'TopNotch Electric',
  },
  {
    title: 'Roof gutter cleaning',
    property: 'Palm Heights',
    unit: 'Main House',
    priority: 'Low',
    category: 'Cleaning',
    status: 'Completed',
    description: 'Quarterly gutter cleaning',
    actualCost: 3000,
  },
];

/* ---- Expected business logic constants ---- */
const EXPECTED_OPEN_COUNT = 3; // Leaking pipe, Paint peeling, Broken door lock
const EXPECTED_IN_PROGRESS_COUNT = 2; // AC not cooling, Electrical outlet
const EXPECTED_COMPLETED_COUNT = 1; // Roof gutter cleaning
const EXPECTED_TOTAL = 6;
const EXPECTED_HIGH_PRIORITY_COUNT = 3; // Leaking pipe, Broken door lock, Electrical outlet

/* ------------------------------------------------------------------ */
/*  Tests: create all 6 requests                                       */
/* ------------------------------------------------------------------ */

test.describe('Maintenance -- create 6 requests via UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/maintenance');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Maintenance' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('create all 6 maintenance requests', async ({ page }) => {
    for (const req of REQUESTS) {
      await createMaintenanceRequest(page, req);
    }

    // Verify all 6 cards are visible on the Kanban board
    await page.waitForTimeout(1000);
    for (const req of REQUESTS) {
      await expect(page.locator('h4').filter({ hasText: req.title }).first()).toBeVisible({ timeout: 10_000 });
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Tests: Kanban column business logic validation                     */
/* ------------------------------------------------------------------ */

test.describe('Maintenance -- Kanban columns after creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/maintenance');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Maintenance' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Kanban columns NEW, IN PROGRESS, COMPLETED are visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'NEW', exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'IN PROGRESS', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'COMPLETED', exact: true }).first()).toBeVisible();
  });

  test('NEW column contains exactly 3 Open requests', async ({ page }) => {
    // 3 Open requests: Leaking pipe, Paint peeling, Broken door lock
    await expect(page.locator('h4').filter({ hasText: 'Leaking pipe in bathroom' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h4').filter({ hasText: 'Paint peeling on wall' }).first()).toBeVisible();
    await expect(page.locator('h4').filter({ hasText: 'Broken door lock' }).first()).toBeVisible();

    // Count cards in the NEW column (first kanban column container)
    // The NEW column is the first column with bg-slate-100 container
    const newColumnHeading = page.getByRole('heading', { name: 'NEW', exact: true }).first();
    const newColumn = newColumnHeading.locator('..').locator('.bg-slate-100');
    const newCards = newColumn.locator('h4');
    const newCount = await newCards.count();
    expect(newCount).toBe(EXPECTED_OPEN_COUNT);
  });

  test('IN PROGRESS column contains exactly 2 requests', async ({ page }) => {
    await expect(page.locator('h4').filter({ hasText: 'AC not cooling properly' }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h4').filter({ hasText: 'Electrical outlet sparking' }).first()).toBeVisible();

    // Count cards in the IN PROGRESS column
    const ipColumnHeading = page.getByRole('heading', { name: 'IN PROGRESS', exact: true }).first();
    const ipColumn = ipColumnHeading.locator('..').locator('.bg-slate-100');
    const ipCards = ipColumn.locator('h4');
    const ipCount = await ipCards.count();
    expect(ipCount).toBe(EXPECTED_IN_PROGRESS_COUNT);
  });

  test('COMPLETED column contains exactly 1 request', async ({ page }) => {
    await expect(page.locator('h4').filter({ hasText: 'Roof gutter cleaning' }).first()).toBeVisible({ timeout: 10_000 });

    // Count cards in the COMPLETED column
    const compColumnHeading = page.getByRole('heading', { name: 'COMPLETED', exact: true }).first();
    const compColumn = compColumnHeading.locator('..').locator('.bg-slate-100');
    const compCards = compColumn.locator('h4');
    const compCount = await compCards.count();
    expect(compCount).toBe(EXPECTED_COMPLETED_COUNT);
  });

  test('High priority requests show HIGH badge on 3 cards', async ({ page }) => {
    // Look for HIGH priority badges across all cards
    const highBadges = page.locator('span').filter({ hasText: /^High$/i });
    const highCount = await highBadges.count();
    expect(highCount).toBe(EXPECTED_HIGH_PRIORITY_COUNT);
  });

  test('Completed request (Roof gutter cleaning) shows actual cost of 3,000', async ({ page }) => {
    // The completed card should display the actual cost
    const gutterCard = page.locator('h4').filter({ hasText: 'Roof gutter cleaning' }).first().locator('..');
    // The cost is shown in a footer area of the card
    const cardContainer = gutterCard.locator('..');
    const cardText = await cardContainer.textContent();
    expect(cardText).toMatch(/3,000|3000/);
  });

  test('In Progress request (AC not cooling) shows contractor CoolAir', async ({ page }) => {
    // Click on the AC card to open edit modal and verify contractor
    await page.locator('h4').filter({ hasText: 'AC not cooling properly' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');
    const contractorInput = dialog.getByPlaceholder('Contractor name');
    const contractorValue = await contractorInput.inputValue();
    expect(contractorValue).toBe('CoolAir HVAC');

    // Close modal
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  test('In Progress request (Electrical outlet) shows contractor TopNotch', async ({ page }) => {
    await page.locator('h4').filter({ hasText: 'Electrical outlet sparking' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');
    const contractorInput = dialog.getByPlaceholder('Contractor name');
    const contractorValue = await contractorInput.inputValue();
    expect(contractorValue).toBe('TopNotch Electric');

    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  Tests: Table view toggle and row count validation                  */
/* ------------------------------------------------------------------ */

test.describe('Maintenance -- Table view business logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/maintenance');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Maintenance' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('switch to Table view shows exactly 6 rows', async ({ page }) => {
    // Switch to Table view
    await page.getByRole('button', { name: /Table view/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 });

    // Verify exactly 6 rows
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 8_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(EXPECTED_TOTAL);
  });

  test('Table view shows all 6 request titles', async ({ page }) => {
    await page.getByRole('button', { name: /Table view/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 });

    for (const req of REQUESTS) {
      await expect(page.getByText(req.title).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('switching back to Kanban view restores columns', async ({ page }) => {
    // Switch to Table view
    await page.getByRole('button', { name: /Table view/i }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('table')).toBeVisible({ timeout: 8_000 });

    // Switch back to Kanban view
    await page.getByRole('button', { name: /Kanban view/i }).click();
    await page.waitForTimeout(500);

    // Verify Kanban columns are back
    await expect(page.getByRole('heading', { name: 'NEW', exact: true }).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('heading', { name: 'IN PROGRESS', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'COMPLETED', exact: true }).first()).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  Tests: Modal behaviour and validation                              */
/* ------------------------------------------------------------------ */

test.describe('Maintenance -- modal behaviour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/maintenance');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Maintenance' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Cancel button closes modal without saving', async ({ page }) => {
    await page.getByRole('button', { name: /New request/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    // Fill title but cancel
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Enter title').fill('Should not be saved');

    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });

    // Verify the request was NOT created
    await expect(page.locator('h4').filter({ hasText: 'Should not be saved' })).not.toBeVisible();
  });

  test('Save button is disabled when title is empty (validation)', async ({ page }) => {
    await page.getByRole('button', { name: /New request/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');

    // Save button should be disabled when title/property/unit are empty
    await expect(dialog.getByRole('button', { name: /^Save$/i })).toBeDisabled();

    // Dialog should remain open (validation prevents save)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Save button remains disabled with title but no property selected', async ({ page }) => {
    await page.getByRole('button', { name: /New request/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');

    // Fill only the title
    await dialog.getByPlaceholder('Enter title').fill('Test request');
    await page.waitForTimeout(300);

    // Save should still be disabled (no property/unit selected)
    await expect(dialog.getByRole('button', { name: /^Save$/i })).toBeDisabled();
  });

  test('Save button becomes enabled once title, property, and unit are filled', async ({ page }) => {
    await page.getByRole('button', { name: /New request/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');

    // Fill title
    await dialog.getByPlaceholder('Enter title').fill('Test request');
    await page.waitForTimeout(300);

    // Select property
    const propertySelect = dialog.locator('span:has-text("Property")').locator('..').locator('select');
    const propertyOption = propertySelect.locator('option').filter({ hasText: 'Sunrise Apartments' }).first();
    const propertyValue = await propertyOption.getAttribute('value');
    await propertySelect.selectOption(propertyValue!);
    await page.waitForTimeout(500);

    // Select unit
    const unitSelect = dialog.locator('span:has-text("Unit")').locator('..').locator('select');
    const unitOption = unitSelect.locator('option').filter({ hasText: 'Unit A' }).first();
    const unitValue = await unitOption.getAttribute('value');
    await unitSelect.selectOption(unitValue!);
    await page.waitForTimeout(300);

    // Save should now be enabled
    await expect(dialog.getByRole('button', { name: /^Save$/i })).toBeEnabled();

    // Cancel instead of saving to keep state clean
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});
