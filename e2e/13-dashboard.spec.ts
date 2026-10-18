/**
 * Dashboard tests -- runs AFTER data has been created by earlier tests.
 * Verifies KPI cards, charts, calendar, filters, and Reminders Panel.
 *
 * Previous tests created: 3 properties, 5 units, 6 tenants, 5 leases,
 * 30 income records, 18 expenses, 6 maintenance requests, 12 utility
 * readings, 3 contracts, 3 reminders, 2 mileage records, 2 notes.
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ */
/*  Dashboard -- page load and KPI business logic                      */
/* ------------------------------------------------------------------ */

test.describe('Dashboard -- page load', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('renders greeting heading with "Hello" and user name', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hello');
  });

  test('shows KPI card: Rent received', async ({ page }) => {
    await expect(page.getByText('Rent received')).toBeVisible({ timeout: 15000 });
  });

  test('shows KPI card: Upcoming payments', async ({ page }) => {
    await expect(page.getByText('Upcoming payments')).toBeVisible({ timeout: 15000 });
  });

  test('shows KPI card: Rent overdue', async ({ page }) => {
    await expect(page.getByText('Rent overdue')).toBeVisible({ timeout: 15000 });
  });

  test('KPI values contain numeric data (body has digits)', async ({ page }) => {
    await expect(page.getByText('Rent received')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/\d/);
  });

  test('renders Cashflow chart with SVG element', async ({ page }) => {
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 });
  });

  test('renders calendar widget with month name heading', async ({ page }) => {
    const calHeader = page.locator('h3').filter({
      hasText: /January|February|March|April|May|June|July|August|September|October|November|December/,
    });
    await expect(calHeader.first()).toBeVisible({ timeout: 15000 });
  });

  test('renders Cash on Cash Return card with percentage value', async ({ page }) => {
    await expect(page.getByText('Cash on Cash Return')).toBeVisible({ timeout: 15000 });
    const cocCard = page.getByText('Cash on Cash Return').locator('..');
    const text = await cocCard.textContent();
    // Should contain a percentage (e.g. "12.5%" or "0%")
    expect(text).toMatch(/%/);
  });

  test('renders Properties donut chart (h3 heading)', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Properties', level: 3 }),
    ).toBeVisible({ timeout: 15000 });
  });

  test('renders Occupancy donut chart (h3 heading)', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Occupancy', level: 3 }),
    ).toBeVisible({ timeout: 15000 });
  });
});

/* ------------------------------------------------------------------ */
/*  Dashboard -- filter dropdowns                                      */
/* ------------------------------------------------------------------ */

test.describe('Dashboard -- filter dropdowns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.getByText('Rent received')).toBeVisible({ timeout: 15000 });
  });

  test('Properties filter button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Properties/i }).first(),
    ).toBeVisible();
  });

  test('Categories filter button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Categories/i }).first(),
    ).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  Dashboard -- activity and transactions                             */
/* ------------------------------------------------------------------ */

test.describe('Dashboard -- activity and transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.getByText('Rent received')).toBeVisible({ timeout: 15000 });
  });

  test('page contains meaningful data entries (not empty)', async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="rounded-lg"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/*  Reminders Panel (Bell icon slide-over)                            */
/* ------------------------------------------------------------------ */

test.describe('Dashboard -- Reminders Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.getByText('Rent received')).toBeVisible({ timeout: 15000 });
  });

  test('Bell icon opens the Reminders panel with heading, search, and tabs', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });

    // Panel has search input
    await expect(page.getByPlaceholder('Find reminders')).toBeVisible();

    // Panel has all 4 tabs
    await expect(page.getByRole('button', { name: /^All/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /OVERDUE/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /UPCOMING/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /SCHEDULED/i })).toBeVisible();
  });

  test('panel All tab shows count badge', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(2000);

    const allTab = page.getByRole('button', { name: /^All/i }).first();
    const allText = await allTab.textContent();
    // The All tab should have a count badge (number)
    expect(allText).toMatch(/All\d+/);
  });

  test('Add Reminder button is disabled when required fields are empty', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });

    await page.getByText('New Reminder').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    // Submit button should be disabled with empty fields
    await expect(page.getByRole('dialog').getByRole('button', { name: /Add Reminder/i })).toBeDisabled();

    // Close
    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  test('create 3 reminders via panel and verify they appear', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(1500);

    // Capture initial count from All tab
    const allTab = page.getByRole('button', { name: /^All/i }).first();
    const initialText = await allTab.textContent();
    const initialCount = parseInt((initialText?.match(/\d+/) || ['0'])[0], 10);

    const reminders = [
      { title: 'Lease renewal - Unit A', dueDate: '2026-03-05', type: 'overdue', property: 'Sunrise Apartments' },
      { title: 'Rent collection follow-up', dueDate: '2026-03-12', type: 'upcoming', property: 'Casa Verde Residences' },
      { title: 'Annual inspection scheduled', dueDate: '2026-09-01', type: 'scheduled', property: 'Palm Heights Villa' },
    ];

    for (const r of reminders) {
      await page.getByText('New Reminder').click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
      const dialog = page.getByRole('dialog');

      await dialog.getByPlaceholder('e.g. Lease renewal - Unit B-202').fill(r.title);
      await dialog.locator('input[type="date"]').fill(r.dueDate);
      await dialog.locator('select').first().selectOption(r.type);
      // Property is now a select dropdown (2nd select in modal)
      // Select property by matching option text
      const propertySelect = dialog.locator('select').nth(1);
      const options = await propertySelect.locator('option').allTextContents();
      const matchingOption = options.find(o => o.includes(r.property));
      if (matchingOption) await propertySelect.selectOption({ label: matchingOption });

      await dialog.getByRole('button', { name: /Add Reminder/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
      await page.waitForTimeout(300);
    }

    // BUSINESS LOGIC: Verify all 3 reminders appear in the panel
    await expect(page.getByText('Lease renewal - Unit A').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Rent collection follow-up').first()).toBeVisible();
    await expect(page.getByText('Annual inspection scheduled').first()).toBeVisible();

    // All tab count should have increased by 3
    const newText = await allTab.textContent();
    const newCount = parseInt((newText?.match(/\d+/) || ['0'])[0], 10);
    expect(newCount).toBe(initialCount + 3);
  });

  test('tab filtering works: OVERDUE/UPCOMING/SCHEDULED show correct items', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(1000);

    // Use unique titles to avoid collision with pre-existing reminders
    const uid = Date.now().toString(36);
    const reminders = [
      { title: `OverdueFilter-${uid}`, dueDate: '2026-03-01', type: 'overdue', property: 'Sunrise Apartments' },
      { title: `UpcomingFilter-${uid}`, dueDate: '2026-03-10', type: 'upcoming', property: 'Casa Verde Residences' },
      { title: `ScheduledFilter-${uid}`, dueDate: '2026-12-01', type: 'scheduled', property: 'Palm Heights Villa' },
    ];

    for (const r of reminders) {
      await page.getByText('New Reminder').click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
      const dialog = page.getByRole('dialog');
      await dialog.getByPlaceholder('e.g. Lease renewal - Unit B-202').fill(r.title);
      await dialog.locator('input[type="date"]').fill(r.dueDate);
      await dialog.locator('select').first().selectOption(r.type);
      // Property is now a select dropdown (2nd select in modal)
      // Select property by matching option text
      const propertySelect = dialog.locator('select').nth(1);
      const options = await propertySelect.locator('option').allTextContents();
      const matchingOption = options.find(o => o.includes(r.property));
      if (matchingOption) await propertySelect.selectOption({ label: matchingOption });
      await dialog.getByRole('button', { name: /Add Reminder/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
      await page.waitForTimeout(300);
    }

    // OVERDUE tab -- our overdue reminder visible, others hidden
    await page.getByRole('button', { name: /OVERDUE/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(`OverdueFilter-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`UpcomingFilter-${uid}`)).not.toBeVisible();
    await expect(page.getByText(`ScheduledFilter-${uid}`)).not.toBeVisible();

    // UPCOMING tab
    await page.getByRole('button', { name: /UPCOMING/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(`UpcomingFilter-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`OverdueFilter-${uid}`)).not.toBeVisible();

    // SCHEDULED tab
    await page.getByRole('button', { name: /SCHEDULED/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(`ScheduledFilter-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`OverdueFilter-${uid}`)).not.toBeVisible();

    // All tab shows all 3
    await page.getByRole('button', { name: /^All/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(`OverdueFilter-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`UpcomingFilter-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`ScheduledFilter-${uid}`).first()).toBeVisible();
  });

  test('search filters reminders and no-match shows "No matching reminders"', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(1000);

    // Use unique titles
    const uid = Date.now().toString(36);
    const reminders = [
      { title: `SearchPipe-${uid}`, dueDate: '2026-04-01', type: 'scheduled', property: 'Sunrise Apartments' },
      { title: `SearchInsure-${uid}`, dueDate: '2026-05-01', type: 'scheduled', property: 'Palm Heights Villa' },
    ];

    for (const r of reminders) {
      await page.getByText('New Reminder').click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
      const dialog = page.getByRole('dialog');
      await dialog.getByPlaceholder('e.g. Lease renewal - Unit B-202').fill(r.title);
      await dialog.locator('input[type="date"]').fill(r.dueDate);
      await dialog.locator('select').first().selectOption(r.type);
      // Property is now a select dropdown (2nd select in modal)
      // Select property by matching option text
      const propertySelect = dialog.locator('select').nth(1);
      const options = await propertySelect.locator('option').allTextContents();
      const matchingOption = options.find(o => o.includes(r.property));
      if (matchingOption) await propertySelect.selectOption({ label: matchingOption });
      await dialog.getByRole('button', { name: /Add Reminder/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 8_000 });
      await page.waitForTimeout(300);
    }

    // Search by unique title -- only matching reminder appears
    await page.getByPlaceholder('Find reminders').fill(`SearchPipe-${uid}`);
    await page.waitForTimeout(500);
    await expect(page.getByText(`SearchPipe-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`SearchInsure-${uid}`)).not.toBeVisible();

    // Search the other unique title
    await page.getByPlaceholder('Find reminders').fill(`SearchInsure-${uid}`);
    await page.waitForTimeout(500);
    await expect(page.getByText(`SearchInsure-${uid}`).first()).toBeVisible();
    await expect(page.getByText(`SearchPipe-${uid}`)).not.toBeVisible();

    // No match shows message
    await page.getByPlaceholder('Find reminders').fill('ZZZNOMATCH_99999');
    await page.waitForTimeout(500);
    await expect(page.getByText('No matching reminders')).toBeVisible();
  });

  test('close panel via button[aria-label="Close reminders"]', async ({ page }) => {
    const bellButton = page.locator('header button').filter({ has: page.locator('svg.lucide-bell') });
    await bellButton.click();
    await expect(page.getByRole('heading', { name: 'Reminders' })).toBeVisible({ timeout: 8_000 });

    await page.locator('button[aria-label="Close reminders"]').click();
    await page.waitForTimeout(500);

    // Bell button should still be visible (panel is closed)
    await expect(bellButton).toBeVisible({ timeout: 5_000 });
    // Verify panel backdrop is gone
    await expect(page.locator('.fixed.inset-0.z-40.opacity-100')).not.toBeVisible({ timeout: 5_000 });
  });
});
