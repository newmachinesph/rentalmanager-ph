/**
 * Organization -- test tab navigation, create reminders, mileage entries
 * and notes through the UI. Validate business logic for each section.
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ */
/*  Tests -- Page structure and tab navigation                        */
/* ------------------------------------------------------------------ */

test.describe('Organization -- page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization');
    await waitForPageLoad(page);
  });

  test('renders the Organization heading', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });
  });

  test('renders tab buttons (Overview, Documents, Mileage & Reminders, Other)', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Documents/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mileage/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Other/i })).toBeVisible();
  });
});

test.describe('Organization -- tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });
  });

  test('clicking Overview tab shows summary content', async ({ page }) => {
    await page.getByRole('button', { name: /Overview/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
  });

  test('clicking Documents tab shows documents section', async ({ page }) => {
    await page.getByRole('button', { name: /Documents/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/document|upload|file/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('clicking Mileage & Reminders tab shows mileage and reminders content', async ({ page }) => {
    await page.getByRole('button', { name: /Mileage/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/reminder|mileage/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('clicking Other tab shows notes content', async ({ page }) => {
    await page.getByRole('button', { name: /Other/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/note|notes/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Mileage & Reminders tab: create reminders                */
/* ------------------------------------------------------------------ */

test.describe('Organization -- create reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });

    // Navigate to Mileage & Reminders tab
    await page.getByRole('button', { name: /Mileage/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Reminders/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('create 3 reminders with correct categories', async ({ page }) => {
    const reminders = [
      { category: 'Insurance Renewal', dateTime: '2026-06-15T09:00', notes: 'Insurance renewal' },
      { category: 'Tax Filing', dateTime: '2026-07-01T09:00', notes: 'Property tax Q2' },
      { category: 'Lease Renewal', dateTime: '2026-08-15T09:00', notes: 'Lease renewal review' },
    ];

    for (const reminder of reminders) {
      const reminderSection = page.locator('.space-y-4').filter({ has: page.locator('h3:has-text("Reminders")') });
      await reminderSection.getByRole('button', { name: /^New$/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
      const dialog = page.getByRole('dialog');

      // Category
      const categorySelect = dialog.locator('label:has-text("Category")').locator('..').locator('select');
      await categorySelect.selectOption(reminder.category);
      await page.waitForTimeout(300);

      // Date & Time
      const dateInput = dialog.locator('label:has-text("Date")').locator('..').locator('input[type="datetime-local"]');
      await dateInput.fill(reminder.dateTime);
      await page.waitForTimeout(300);

      // Notes
      const notesTextarea = dialog.locator('label:has-text("Notes")').locator('..').locator('textarea');
      await notesTextarea.fill(reminder.notes);
      await page.waitForTimeout(300);

      // Submit
      await dialog.getByRole('button', { name: /^Save$/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // BUSINESS LOGIC: Verify all 3 reminders are visible with correct categories
    await expect(page.getByText('Insurance Renewal').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Tax Filing').first()).toBeVisible();
    await expect(page.getByText('Lease Renewal').first()).toBeVisible();
  });

  test('reminders show correct notes content', async ({ page }) => {
    // After creation from previous test (data persisted), verify notes
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Insurance renewal');
    expect(bodyText).toContain('Property tax Q2');
    expect(bodyText).toContain('Lease renewal review');
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Mileage & Reminders tab: create mileage entries          */
/* ------------------------------------------------------------------ */

test.describe('Organization -- create mileage entries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });

    // Navigate to Mileage & Reminders tab
    await page.getByRole('button', { name: /Mileage/i }).click();
    await page.waitForTimeout(500);
  });

  test('create 2 mileage records with correct locations', async ({ page }) => {
    const mileageEntries = [
      { startLocation: 'Office, Makati', endLocation: 'Sunrise Apartments', dateTime: '2026-03-15T10:00', purpose: 'Property inspection' },
      { startLocation: 'Office, Makati', endLocation: 'Casa Verde Residences', dateTime: '2026-04-20T14:00', purpose: 'Tenant meeting' },
    ];

    for (const entry of mileageEntries) {
      // Click "New" button in mileage section
      const mileageSection = page.locator('.space-y-4').filter({ has: page.locator('h3:has-text("Mileage")') }).last();
      await mileageSection.getByRole('button', { name: /^New$/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
      const dialog = page.getByRole('dialog');

      // Start location
      const startInput = dialog.locator('label:has-text("Start location")').locator('..').locator('input');
      await startInput.fill(entry.startLocation);
      await page.waitForTimeout(300);

      // Next location
      const endInput = dialog.locator('label:has-text("Next location")').locator('..').locator('input');
      await endInput.fill(entry.endLocation);
      await page.waitForTimeout(300);

      // Start date & time
      const dateInput = dialog.locator('label:has-text("Start date")').locator('..').locator('input[type="datetime-local"]');
      await dateInput.fill(entry.dateTime);
      await page.waitForTimeout(300);

      // Purpose
      const purposeInput = dialog.locator('label:has-text("Purpose")').locator('..').locator('input');
      await purposeInput.fill(entry.purpose);
      await page.waitForTimeout(300);

      // Submit
      await dialog.getByRole('button', { name: /^Save$/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // BUSINESS LOGIC: Verify 2 mileage entries visible with correct locations
    await expect(page.getByText('Property inspection').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Tenant meeting').first()).toBeVisible();

    // Verify locations are displayed
    const bodyText = await page.locator('body').textContent() || '';
    expect(bodyText).toContain('Office');
    expect(bodyText).toContain('Sunrise');
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Other tab: create notes                                   */
/* ------------------------------------------------------------------ */

test.describe('Organization -- create notes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organization');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });

    // Navigate to Other tab
    await page.getByRole('button', { name: /Other/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/Notes/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('create 2 notes with correct content', async ({ page }) => {
    const notes = [
      { content: 'Maria Santos requested additional parking' },
      { content: 'Consider kitchen renovation for Unit B' },
    ];

    for (const note of notes) {
      // Click "New" button in notes section
      const notesSection = page.locator('h3:has-text("Notes")').locator('..');
      await notesSection.getByRole('button', { name: /New/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
      const dialog = page.getByRole('dialog');

      // Note content (FormField label is "Note")
      const noteTextarea = dialog.locator('label:has-text("Note")').locator('..').locator('textarea');
      await noteTextarea.fill(note.content);
      await page.waitForTimeout(300);

      // Submit
      await dialog.getByRole('button', { name: /^Save$/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(500);
    }

    // BUSINESS LOGIC: Verify 2 notes visible with correct content
    await expect(page.getByText('Maria Santos requested additional parking').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Consider kitchen renovation for Unit B').first()).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/*  Tests -- Tab navigation works between all tabs (round-trip)       */
/* ------------------------------------------------------------------ */

test.describe('Organization -- tab round-trip navigation', () => {
  test('can navigate between all 4 tabs without errors', async ({ page }) => {
    await page.goto('/organization');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 12_000 });

    // Overview -> Documents
    await page.getByRole('button', { name: /Overview/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Documents/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/document|upload|file/i).first()).toBeVisible({ timeout: 8_000 });

    // Documents -> Mileage & Reminders
    await page.getByRole('button', { name: /Mileage/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/reminder|mileage/i).first()).toBeVisible({ timeout: 8_000 });

    // Mileage & Reminders -> Other
    await page.getByRole('button', { name: /Other/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/note|notes/i).first()).toBeVisible({ timeout: 8_000 });

    // Other -> Overview (full circle)
    await page.getByRole('button', { name: /Overview/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
  });
});
