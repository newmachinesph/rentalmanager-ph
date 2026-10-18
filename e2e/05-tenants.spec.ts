/**
 * Tenants tests -- create 6 tenants through modal dialog (5 persons + 1 company),
 * then validate business logic: exact count, correct names and emails, tab filters,
 * search by email, company tenant display, and validation errors.
 *
 * Tenants created:
 * 1. Maria Santos (Teacher, Manila Academy, DOB: 1990-05-15)
 * 2. Carlos Reyes (Engineer, DPWH, DOB: 1985-03-20)
 * 3. Ana Mendoza (Nurse, St. Luke's, DOB: 1992-08-10)
 * 4. Roberto Cruz (Accountant, SGV & Co, DOB: 1988-11-25)
 * 5. Elena Garcia (Designer, Freelance, DOB: 1995-01-30)
 * 6. TechStart PH Inc (Company type, techstart@company.ph)
 *
 * Uses stored auth (admin session from auth.setup.ts).
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ------------------------------------------------------------------ Data */

const PERSON_TENANTS = [
  {
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria.santos@email.com',
    phone: '+63 917 111 1111',
    dob: '1990-05-15',
    occupation: 'Teacher',
    employer: 'Manila Academy',
  },
  {
    firstName: 'Carlos',
    lastName: 'Reyes',
    email: 'carlos.reyes@email.com',
    phone: '+63 918 222 2222',
    dob: '1985-03-20',
    occupation: 'Engineer',
    employer: 'DPWH',
  },
  {
    firstName: 'Ana',
    lastName: 'Mendoza',
    email: 'ana.mendoza@email.com',
    phone: '+63 919 333 3333',
    dob: '1992-08-10',
    occupation: 'Nurse',
    employer: "St. Luke's",
  },
  {
    firstName: 'Roberto',
    lastName: 'Cruz',
    email: 'roberto.cruz@email.com',
    phone: '+63 920 444 4444',
    dob: '1988-11-25',
    occupation: 'Accountant',
    employer: 'SGV & Co',
  },
  {
    firstName: 'Elena',
    lastName: 'Garcia',
    email: 'elena.garcia@email.com',
    phone: '+63 921 555 5555',
    dob: '1995-01-30',
    occupation: 'Designer',
    employer: 'Freelance',
  },
];

/* ------------------------------------------------------------------ Tests */

test.describe('Tenants - create tenants through UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenants');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Tenants' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('page has heading, add button, filter tabs, and search', async ({ page }) => {
    await expect(page.getByRole('button', { name: /New tenant/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^All/ }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible();
  });

  test('tab filters are visible: All, Current, Past Tenants, Prospective', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^All/ }).first()).toBeVisible({ timeout: 12_000 });
    await expect(page.getByRole('button', { name: /Current/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Past Tenants/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Prospective/ }).first()).toBeVisible();
  });

  test('edge case: save with empty required fields -> dialog stays open (validation error)', async ({ page }) => {
    await page.getByRole('button', { name: /New tenant/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');

    // Try saving without filling any fields
    await dialog.getByRole('button', { name: /^Save$/i }).click();

    // Dialog should remain open due to validation -- this proves the form enforces required fields
    await page.waitForTimeout(1000);
    await expect(page.getByRole('dialog')).toBeVisible();

    // Close dialog
    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
  });

  for (const tenant of PERSON_TENANTS) {
    test(`create person tenant: ${tenant.firstName} ${tenant.lastName}`, async ({ page }) => {
      await page.getByRole('button', { name: /New tenant/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

      const dialog = page.getByRole('dialog');

      // Verify modal title
      await expect(dialog.getByText('Add new tenant')).toBeVisible();

      // Person type is default - no need to click toggle
      await dialog.getByPlaceholder('e.g. Maria').fill(tenant.firstName);
      await dialog.getByPlaceholder('e.g. Santos').fill(tenant.lastName);
      await dialog.getByPlaceholder('email@example.com').fill(tenant.email);
      await dialog.getByPlaceholder('+63 917 123 4567').fill(tenant.phone);

      // Date of birth
      await dialog.locator('input[type="date"]').first().fill(tenant.dob);

      // Occupation and employer
      await dialog.getByPlaceholder('e.g. Software Engineer').fill(tenant.occupation);
      await dialog.getByPlaceholder('e.g. Acme Corp').fill(tenant.employer);

      // Submit
      await dialog.getByRole('button', { name: /^Save$/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

      // Verify tenant appears in the list with correct full name
      await expect(page.getByText(`${tenant.firstName} ${tenant.lastName}`).first()).toBeVisible({ timeout: 10_000 });

      // Verify the email is displayed correctly in the table
      await expect(page.getByText(tenant.email).first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test('create company tenant: TechStart PH Inc', async ({ page }) => {
    await page.getByRole('button', { name: /New tenant/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });

    const dialog = page.getByRole('dialog');

    // Click Company type toggle
    await dialog.getByRole('button', { name: 'Company' }).click();
    await page.waitForTimeout(300);

    // Fill company name (uses the company name placeholder "e.g. ABC Corp")
    await dialog.getByPlaceholder('e.g. ABC Corp').fill('TechStart PH Inc');
    await dialog.getByPlaceholder('email@example.com').fill('techstart@company.ph');
    await dialog.getByPlaceholder('+63 917 123 4567').fill('+63 922 666 6666');

    // Submit
    await dialog.getByRole('button', { name: /^Save$/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 });

    // Verify company tenant appears with correct name
    await expect(page.getByText('TechStart PH Inc').first()).toBeVisible({ timeout: 10_000 });

    // Verify company email is displayed
    await expect(page.getByText('techstart@company.ph').first()).toBeVisible({ timeout: 10_000 });
  });
});

/* ====================================================================== */
/* Tests: business logic validation after all tenants created              */
/* ====================================================================== */

test.describe('Tenants - Business logic validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenants');
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: 'Tenants' }).first()).toBeVisible({ timeout: 15_000 });
    // Wait for table to load
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('verify exact count of 6 tenants in the table', async ({ page }) => {
    // Wait for all tenants to load
    await expect(page.getByText('Maria Santos').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('TechStart PH Inc').first()).toBeVisible({ timeout: 10_000 });

    // Count table rows -- should be exactly 6
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(6);
  });

  test('verify each tenant name and email are correct in the table', async ({ page }) => {
    // Verify all person tenants with correct names and emails
    const expectedTenants = [
      { name: 'Maria Santos', email: 'maria.santos@email.com' },
      { name: 'Carlos Reyes', email: 'carlos.reyes@email.com' },
      { name: 'Ana Mendoza', email: 'ana.mendoza@email.com' },
      { name: 'Roberto Cruz', email: 'roberto.cruz@email.com' },
      { name: 'Elena Garcia', email: 'elena.garcia@email.com' },
      { name: 'TechStart PH Inc', email: 'techstart@company.ph' },
    ];

    for (const tenant of expectedTenants) {
      await expect(page.getByText(tenant.name).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(tenant.email).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('Current tab shows 0 tenants (no leases assigned yet)', async ({ page }) => {
    await page.getByRole('button', { name: /Current/ }).first().click();
    await page.waitForTimeout(500);

    // No leases have been created yet, so "Current" tenants should be 0
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(0);
  });

  test('search by email "carlos.reyes@email.com" finds exactly Carlos Reyes', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('carlos.reyes@email.com');
    await page.waitForTimeout(500);

    // Carlos should be visible
    await expect(page.getByText('Carlos Reyes').first()).toBeVisible();

    // Other tenants should not be visible
    await expect(page.getByText('Maria Santos')).not.toBeVisible();
    await expect(page.getByText('Ana Mendoza')).not.toBeVisible();
    await expect(page.getByText('TechStart PH Inc')).not.toBeVisible();

    // Verify only 1 row
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(1);
  });

  test('search by "techstart" finds the company tenant', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('techstart');
    await page.waitForTimeout(500);

    await expect(page.getByText('TechStart PH Inc').first()).toBeVisible();
    await expect(page.getByText('techstart@company.ph').first()).toBeVisible();

    // Person tenants should be hidden
    await expect(page.getByText('Maria Santos')).not.toBeVisible();
    await expect(page.getByText('Elena Garcia')).not.toBeVisible();
  });

  test('search "Maria" shows Maria Santos, "ZZZNOMATCH" shows none', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Maria');
    await page.waitForTimeout(500);
    await expect(page.getByText('Maria Santos').first()).toBeVisible();
    expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);

    await page.getByPlaceholder(/search/i).first().fill('ZZZNOMATCH99999');
    await page.waitForTimeout(500);
    expect(await page.locator('table tbody tr').count()).toBe(0);
  });

  test('company tenant TechStart PH Inc shows correctly in list with email', async ({ page }) => {
    // Verify company tenant is visible along with its email
    await expect(page.getByText('TechStart PH Inc').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('techstart@company.ph').first()).toBeVisible({ timeout: 10_000 });
  });
});
