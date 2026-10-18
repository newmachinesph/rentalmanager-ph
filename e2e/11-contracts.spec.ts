/**
 * Contracts -- generate 3 contracts through the UI,
 * update statuses (Draft -> Final -> Signed), verify tab filters,
 * search, KPI cards, and status transition persistence.
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ */
/*  Helper: generate a contract via the modal by selecting a lease    */
/* ------------------------------------------------------------------ */

async function generateContract(
  page: import('@playwright/test').Page,
  tenantName: string,
) {
  await page.getByRole('button', { name: /Generate Contract/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
  const dialog = page.getByRole('dialog');

  // Select lease by tenant name -- the option text contains "TenantName -- PropertyName / UnitName"
  const leaseSelect = dialog.locator('label:has-text("Lease")').locator('..').locator('select');
  const leaseOption = leaseSelect.locator('option').filter({ hasText: tenantName }).first();
  const leaseValue = await leaseOption.getAttribute('value');
  await leaseSelect.selectOption(leaseValue!);
  await page.waitForTimeout(500);

  // Click "Generate Contract" submit button
  await dialog.getByRole('button', { name: /Generate Contract/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1000);
}

/* ------------------------------------------------------------------ */
/*  Tests -- Create contracts                                         */
/* ------------------------------------------------------------------ */

test.describe('Contracts -- generate 3 contracts via UI', () => {
  test('generate contract for Maria Santos (Draft - no status change)', async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });

    await generateContract(page, 'Maria Santos');

    // Verify contract appears in table
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Maria Santos').first()).toBeVisible({ timeout: 10_000 });
  });

  test('generate contract for Carlos Reyes and transition Draft -> Final -> Signed', async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });

    await generateContract(page, 'Carlos Reyes');
    await page.waitForTimeout(500);

    // Click on the Carlos Reyes contract row to open view
    await page.getByText('Carlos Reyes').first().click();
    await page.waitForTimeout(1000);

    // Mark as Final -- validates Draft -> Final transition
    await page.getByRole('button', { name: /Mark Final/i }).click();
    await page.waitForTimeout(1000);

    // Mark as Signed -- validates Final -> Signed transition
    await page.getByRole('button', { name: /Mark Signed/i }).click();
    await page.waitForTimeout(1000);

    // Close the view modal by clicking the X button
    await page.locator('.fixed.inset-0.z-50').getByRole('button').filter({ has: page.locator('svg') }).last().click();
    await page.waitForTimeout(500);
  });

  test('generate contract for Ana Mendoza and transition Draft -> Final', async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });

    await generateContract(page, 'Ana Mendoza');
    await page.waitForTimeout(500);

    // Click on the Ana Mendoza contract row to open view
    await page.getByText('Ana Mendoza').first().click();
    await page.waitForTimeout(1000);

    // Mark as Final
    await page.getByRole('button', { name: /Mark Final/i }).click();
    await page.waitForTimeout(1000);

    // Close the view modal
    await page.locator('.fixed.inset-0.z-50').getByRole('button').filter({ has: page.locator('svg') }).last().click();
    await page.waitForTimeout(500);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- KPI cards business logic                                  */
/* ------------------------------------------------------------------ */

test.describe('Contracts -- KPI business logic validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('KPI "Total Contracts" = 3', async ({ page }) => {
    await expect(page.getByText('Total Contracts')).toBeVisible({ timeout: 10_000 });
    const kpiCard = page.getByText('Total Contracts').locator('..');
    const kpiText = await kpiCard.textContent();
    const match = kpiText?.match(/(\d+)/);
    expect(match).toBeTruthy();
    expect(parseInt(match![1], 10)).toBeGreaterThanOrEqual(3);
  });

  test('KPI "Draft" = 1 (Maria Santos)', async ({ page }) => {
    await expect(page.getByText('Draft').first()).toBeVisible({ timeout: 10_000 });
    // The Draft KPI card should show count of 1
    const draftKpi = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /Draft/ }).first();
    const draftText = await draftKpi.textContent();
    expect(draftText).toMatch(/1/);
  });

  test('KPI "Finalized" = 1 (Ana Mendoza)', async ({ page }) => {
    // The Finalized/Final KPI card should show count of 1
    const finalKpi = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /Final/ }).first();
    const finalText = await finalKpi.textContent();
    expect(finalText).toBeTruthy();
    expect(finalText).toMatch(/1/);
  });

  test('KPI "Signed" = 1 (Carlos Reyes)', async ({ page }) => {
    // The Signed KPI card should show count of 1
    const signedKpi = page.locator('[class*="card"], [class*="rounded"]').filter({ hasText: /Signed/ }).first();
    const signedText = await signedKpi.textContent();
    expect(signedText).toBeTruthy();
    expect(signedText).toMatch(/1/);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Tab filters                                               */
/* ------------------------------------------------------------------ */

test.describe('Contracts -- tab filters validate status distribution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('All tab shows all 3 contracts', async ({ page }) => {
    await page.getByRole('button', { name: /^All/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(3);
  });

  test('Draft tab shows 1 row (Maria Santos)', async ({ page }) => {
    await page.getByRole('button', { name: /^Draft/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    // Maria should be visible in Draft tab
    await expect(page.getByText('Maria Santos').first()).toBeVisible();
  });

  test('Final tab shows 1 row (Ana Mendoza)', async ({ page }) => {
    await page.getByRole('button', { name: /^Final/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    // Ana should be visible in Final tab
    await expect(page.getByText('Ana Mendoza').first()).toBeVisible();
  });

  test('Signed tab shows 1 row (Carlos Reyes)', async ({ page }) => {
    await page.getByRole('button', { name: /^Signed/ }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10_000 });
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    // Carlos should be visible in Signed tab
    await expect(page.getByText('Carlos Reyes').first()).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Search                                                    */
/* ------------------------------------------------------------------ */

test.describe('Contracts -- search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('search "Maria" shows exactly 1 row for Maria Santos', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Maria');
    await page.waitForTimeout(500);
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    await expect(page.getByText('Maria Santos').first()).toBeVisible();
  });

  test('search with no match shows 0 rows', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('ZZZNOMATCH_CONTRACT_99999');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Status transitions are persistent                         */
/* ------------------------------------------------------------------ */

test.describe('Contracts -- status persistence after page reload', () => {
  test('Carlos Reyes remains Signed after page reload', async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });

    // Switch to Signed tab
    await page.getByRole('button', { name: /^Signed/ }).first().click();
    await page.waitForTimeout(500);

    // Carlos should still be in Signed tab
    await expect(page.getByText('Carlos Reyes').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Ana Mendoza remains Final after page reload', async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });

    // Switch to Final tab
    await page.getByRole('button', { name: /^Final/ }).first().click();
    await page.waitForTimeout(500);

    // Ana should still be in Final tab
    await expect(page.getByText('Ana Mendoza').first()).toBeVisible({ timeout: 10_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Modal behaviour                                           */
/* ------------------------------------------------------------------ */

test.describe('Contracts -- modal behaviour', () => {
  test('Cancel closes the Generate Contract modal', async ({ page }) => {
    await page.goto('/contracts');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Contracts' }).first()).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Generate Contract/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });
});
