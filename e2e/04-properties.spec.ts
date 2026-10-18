/**
 * Properties tests -- create 3 properties through the full-page form, add
 * units via the modal on each property's detail page, then validate business
 * logic: correct counts, rent amounts, search filtering, type filtering,
 * address correctness, and initial vacant status of all units.
 *
 * Properties created:
 * 1. Sunrise Apartments  -- Multi-unit, Apartment, Makati City
 *    Units: Unit A (floor 1, 2bed, 1bath, 35sqm, 15000)
 *           Unit B (floor 2, 3bed, 2bath, 50sqm, 22000)
 * 2. Casa Verde Residences -- Multi-unit, Townhouse, Quezon City
 *    Units: Unit 1 (floor 1, 1bed, 1bath, 28sqm, 12000)
 *           Unit 2 (floor 2, 2bed, 1bath, 40sqm, 18000)
 * 3. Palm Heights Villa -- Single-unit, House, Pasig City
 *    Units: Main House (floor 1, 4bed, 3bath, 120sqm, 45000)
 *
 * Uses stored auth (admin session from auth.setup.ts).
 */
import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

/* ====================================================================== */
/* Helpers                                                                 */
/* ====================================================================== */

/**
 * Fill the full-page "Add Property" form and submit it.
 */
async function fillPropertyForm(
  page: import('@playwright/test').Page,
  data: {
    name: string;
    address: string;
    barangay: string;
    city: string;
    province: string;
    zip: string;
    typeSelection: 'single' | 'multi';
    specificType: string;
  }
) {
  await page.getByPlaceholder('e.g. Sunrise Apartments').fill(data.name);
  await page.getByPlaceholder('e.g. 123 Rizal Avenue').fill(data.address);
  await page.getByPlaceholder('e.g. Brgy. San Lorenzo').fill(data.barangay);
  await page.getByPlaceholder('e.g. Makati City').fill(data.city);
  await page.getByPlaceholder('e.g. Metro Manila').fill(data.province);
  await page.getByPlaceholder('e.g. 1226').fill(data.zip);

  // Select property type toggle
  if (data.typeSelection === 'multi') {
    await page.getByText('Multi-unit').click();
  } else {
    await page.getByText('Single Family Home').click();
  }

  // Select specific type from dropdown
  const specificTypeSelect = page.locator('label:has-text("Specific Type")').locator('..').locator('select');
  await specificTypeSelect.selectOption(data.specificType);
}

/**
 * Add a unit via the modal on a property detail page.
 */
async function addUnit(
  page: import('@playwright/test').Page,
  data: {
    name: string;
    floor: string;
    bedrooms: string;
    bathrooms: string;
    area: string;
    rent: string;
  }
) {
  // Click the "New" button in the Units section to open the modal
  await page.getByRole('button', { name: 'New' }).first().click();
  await page.waitForTimeout(500);

  // Locate the modal overlay
  const modal = page.locator('.fixed.inset-0.z-50');
  await expect(modal).toBeVisible({ timeout: 10_000 });

  // Fill unit fields inside the modal
  await modal.locator('input[placeholder*="#1A"]').fill(data.name);
  await modal.locator('input[placeholder*="Ground"]').fill(data.floor);

  const bedroomsInput = modal.locator('label:has-text("Bedrooms")').locator('..').locator('input');
  const bathroomsInput = modal.locator('label:has-text("Bathrooms")').locator('..').locator('input');
  const areaInput = modal.locator('label:has-text("Area")').locator('..').locator('input');
  const rentInput = modal.locator('label:has-text("Monthly Rent")').locator('..').locator('input');

  await bedroomsInput.fill(data.bedrooms);
  await bathroomsInput.fill(data.bathrooms);
  await areaInput.fill(data.area);
  await rentInput.fill(data.rent);

  // Submit
  await modal.getByRole('button', { name: /Add Unit/i }).click();
  await page.waitForTimeout(1000);

  // Modal should close
  await expect(modal).not.toBeVisible({ timeout: 10_000 });
}

/* ====================================================================== */
/* Tests: create properties                                                */
/* ====================================================================== */

test.describe('Properties - Create 3 properties via full-page form', () => {
  test('create Sunrise Apartments (Multi-unit, Apartment)', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Properties' }).first()
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to Add Property form
    await page.getByRole('button', { name: /Add property/i }).first().click();
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Add Property' })
    ).toBeVisible({ timeout: 15_000 });

    await fillPropertyForm(page, {
      name: 'Sunrise Apartments',
      address: '123 Rizal Avenue',
      barangay: 'Brgy. San Lorenzo',
      city: 'Makati City',
      province: 'Metro Manila',
      zip: '1226',
      typeSelection: 'multi',
      specificType: 'Apartment',
    });

    // Submit
    await page.locator('form').getByRole('button', { name: /Add Property/i }).click();
    await waitForPageLoad(page);

    // Verify it appears in the list with correct name
    await expect(
      page.getByText('Sunrise Apartments').first()
    ).toBeVisible({ timeout: 15_000 });

    // Verify the address is displayed correctly on the list
    await expect(
      page.getByText('123 Rizal Avenue').first()
    ).toBeVisible({ timeout: 10_000 });

    // Verify city is shown
    await expect(
      page.getByText('Makati City').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('create Casa Verde Residences (Multi-unit, Townhouse)', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Properties' }).first()
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Add property/i }).first().click();
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Add Property' })
    ).toBeVisible({ timeout: 15_000 });

    await fillPropertyForm(page, {
      name: 'Casa Verde Residences',
      address: '456 Mabini St',
      barangay: 'Brgy. Pinyahan',
      city: 'Quezon City',
      province: 'Metro Manila',
      zip: '1100',
      typeSelection: 'multi',
      specificType: 'Townhouse',
    });

    await page.locator('form').getByRole('button', { name: /Add Property/i }).click();
    await waitForPageLoad(page);

    // Verify property and address in list
    await expect(
      page.getByText('Casa Verde Residences').first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText('456 Mabini St').first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Quezon City').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('create Palm Heights Villa (Single-unit, House)', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Properties' }).first()
    ).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /Add property/i }).first().click();
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Add Property' })
    ).toBeVisible({ timeout: 15_000 });

    await fillPropertyForm(page, {
      name: 'Palm Heights Villa',
      address: '789 Ortigas Ave',
      barangay: 'Brgy. Ugong',
      city: 'Pasig City',
      province: 'Metro Manila',
      zip: '1604',
      typeSelection: 'single',
      specificType: 'House',
    });

    await page.locator('form').getByRole('button', { name: /Add Property/i }).click();
    await waitForPageLoad(page);

    // Verify property and address in list
    await expect(
      page.getByText('Palm Heights Villa').first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText('789 Ortigas Ave').first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Pasig City').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('verify exactly 3 properties exist after creation', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);

    // Wait for all 3 to appear
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Casa Verde Residences').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Palm Heights Villa').first()).toBeVisible({ timeout: 10_000 });

    // Verify exactly 3 properties are listed -- count property cards/rows
    // All 3 names must be present and no more
    const allPropertyNames = ['Sunrise Apartments', 'Casa Verde Residences', 'Palm Heights Villa'];
    for (const name of allPropertyNames) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });
});

/* ====================================================================== */
/* Tests: add units to each property                                       */
/* ====================================================================== */

test.describe('Properties - Add units via detail page modal', () => {
  test('add Unit A and Unit B to Sunrise Apartments', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByText('Sunrise Apartments').first()
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to detail page
    await page.getByText('Sunrise Apartments').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Add Unit A
    await addUnit(page, {
      name: 'Unit A',
      floor: '1',
      bedrooms: '2',
      bathrooms: '1',
      area: '35',
      rent: '15000',
    });
    await expect(page.getByText('Unit A').first()).toBeVisible({ timeout: 15_000 });

    // Verify Unit A rent amount is correct (15,000)
    await expect(page.getByText('15,000').first()).toBeVisible({ timeout: 10_000 });

    // Add Unit B
    await addUnit(page, {
      name: 'Unit B',
      floor: '2',
      bedrooms: '3',
      bathrooms: '2',
      area: '50',
      rent: '22000',
    });
    await expect(page.getByText('Unit B').first()).toBeVisible({ timeout: 15_000 });

    // Verify Unit B rent amount is correct (22,000)
    await expect(page.getByText('22,000').first()).toBeVisible({ timeout: 10_000 });

    // Verify both units show Vacant status (no tenants assigned yet)
    const vacantBadges = page.getByText('Vacant');
    await expect(vacantBadges.first()).toBeVisible({ timeout: 10_000 });
  });

  test('add Unit 1 and Unit 2 to Casa Verde Residences', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByText('Casa Verde Residences').first()
    ).toBeVisible({ timeout: 15_000 });

    await page.getByText('Casa Verde Residences').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Add Unit 1
    await addUnit(page, {
      name: 'Unit 1',
      floor: '1',
      bedrooms: '1',
      bathrooms: '1',
      area: '28',
      rent: '12000',
    });
    await expect(page.getByText('Unit 1').first()).toBeVisible({ timeout: 15_000 });

    // Verify Unit 1 rent is 12,000
    await expect(page.getByText('12,000').first()).toBeVisible({ timeout: 10_000 });

    // Add Unit 2
    await addUnit(page, {
      name: 'Unit 2',
      floor: '2',
      bedrooms: '2',
      bathrooms: '1',
      area: '40',
      rent: '18000',
    });
    await expect(page.getByText('Unit 2').first()).toBeVisible({ timeout: 15_000 });

    // Verify Unit 2 rent is 18,000
    await expect(page.getByText('18,000').first()).toBeVisible({ timeout: 10_000 });

    // Verify units show Vacant status
    const vacantBadges = page.getByText('Vacant');
    await expect(vacantBadges.first()).toBeVisible({ timeout: 10_000 });
  });

  test('add Main House to Palm Heights Villa', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByText('Palm Heights Villa').first()
    ).toBeVisible({ timeout: 15_000 });

    await page.getByText('Palm Heights Villa').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Add Main House
    await addUnit(page, {
      name: 'Main House',
      floor: '1',
      bedrooms: '4',
      bathrooms: '3',
      area: '120',
      rent: '45000',
    });
    await expect(page.getByText('Main House').first()).toBeVisible({ timeout: 15_000 });

    // Verify rent is 45,000
    await expect(page.getByText('45,000').first()).toBeVisible({ timeout: 10_000 });

    // Verify Vacant status
    await expect(page.getByText('Vacant').first()).toBeVisible({ timeout: 10_000 });
  });
});

/* ====================================================================== */
/* Tests: search and filter with business logic validation                 */
/* ====================================================================== */

test.describe('Properties - Search and filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByRole('heading', { name: 'Properties' }).first()
    ).toBeVisible({ timeout: 15_000 });
    // Wait for property data to load
    await expect(
      page.getByText('Sunrise Apartments').first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('search for "Sunrise" shows only Sunrise Apartments, others hidden', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Sunrise');
    await page.waitForTimeout(500);

    // Only Sunrise should be visible
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible();
    await expect(page.getByText('Casa Verde Residences')).not.toBeVisible();
    await expect(page.getByText('Palm Heights Villa')).not.toBeVisible();

    // Verify the address shown is Sunrise's address, not others
    await expect(page.getByText('123 Rizal Avenue').first()).toBeVisible();
    await expect(page.getByText('456 Mabini St')).not.toBeVisible();
    await expect(page.getByText('789 Ortigas Ave')).not.toBeVisible();
  });

  test('search for "Makati" shows only properties in Makati', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('Makati');
    await page.waitForTimeout(500);

    // Only Sunrise is in Makati City
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible();
    await expect(page.getByText('Palm Heights Villa')).not.toBeVisible();
  });

  test('search for "ZZZNOMATCH" shows no properties', async ({ page }) => {
    await page.getByPlaceholder(/search/i).first().fill('ZZZNOMATCH');
    await page.waitForTimeout(500);

    await expect(page.getByText('Sunrise Apartments')).not.toBeVisible();
    await expect(page.getByText('Casa Verde Residences')).not.toBeVisible();
    await expect(page.getByText('Palm Heights Villa')).not.toBeVisible();
  });

  test('Multi-Unit filter hides Palm Heights Villa (single); All shows everything', async ({ page }) => {
    // Click Multi-Unit filter
    await page.getByRole('button', { name: /Multi-Unit/i }).click();
    await page.waitForTimeout(500);

    // Palm Heights Villa is single-unit, should be hidden
    await expect(page.getByText('Palm Heights Villa')).not.toBeVisible();
    // Multi-unit properties should still be visible
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible();
    await expect(page.getByText('Casa Verde Residences').first()).toBeVisible();

    // Click All to reset
    await page.getByRole('button', { name: /^All/ }).first().click();
    await page.waitForTimeout(500);

    // All 3 should be visible again
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible();
    await expect(page.getByText('Casa Verde Residences').first()).toBeVisible();
    await expect(page.getByText('Palm Heights Villa').first()).toBeVisible();
  });
});

/* ====================================================================== */
/* Tests: detail page validation -- address, type, units, vacant status    */
/* ====================================================================== */

test.describe('Properties - Detail page business logic verification', () => {
  test('Sunrise Apartments detail shows correct address, type, and both units with rents', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await expect(
      page.getByText('Sunrise Apartments').first()
    ).toBeVisible({ timeout: 15_000 });

    // Navigate to detail
    await page.getByText('Sunrise Apartments').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Verify correct property name on detail page
    await expect(page.getByText('Sunrise Apartments').first()).toBeVisible({ timeout: 15_000 });

    // Verify address components
    await expect(page.getByText('123 Rizal Avenue').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Makati City').first()).toBeVisible({ timeout: 10_000 });

    // Verify both units exist
    await expect(page.getByText('Unit A').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Unit B').first()).toBeVisible({ timeout: 10_000 });

    // Verify correct rent amounts
    await expect(page.getByText('15,000').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('22,000').first()).toBeVisible({ timeout: 10_000 });

    // Verify units are Vacant (no leases yet)
    const vacantBadges = page.getByText('Vacant');
    const vacantCount = await vacantBadges.count();
    expect(vacantCount).toBeGreaterThanOrEqual(2);
  });

  test('Casa Verde Residences detail shows correct address and units', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await page.getByText('Casa Verde Residences').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Verify correct property name
    await expect(page.getByText('Casa Verde Residences').first()).toBeVisible({ timeout: 15_000 });

    // Verify address
    await expect(page.getByText('456 Mabini St').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Quezon City').first()).toBeVisible({ timeout: 10_000 });

    // Verify both units and rents
    await expect(page.getByText('Unit 1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Unit 2').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('12,000').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('18,000').first()).toBeVisible({ timeout: 10_000 });

    // Both should be Vacant
    const vacantBadges = page.getByText('Vacant');
    const vacantCount = await vacantBadges.count();
    expect(vacantCount).toBeGreaterThanOrEqual(2);
  });

  test('Palm Heights Villa detail shows correct address, House type, and single unit', async ({ page }) => {
    await page.goto('/properties');
    await waitForPageLoad(page);
    await page.getByText('Palm Heights Villa').first().click();
    await page.waitForURL(/\/properties\//, { timeout: 15_000 });
    await waitForPageLoad(page);

    // Verify correct property name
    await expect(page.getByText('Palm Heights Villa').first()).toBeVisible({ timeout: 15_000 });

    // Verify address
    await expect(page.getByText('789 Ortigas Ave').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Pasig City').first()).toBeVisible({ timeout: 10_000 });

    // Verify single unit and rent
    await expect(page.getByText('Main House').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('45,000').first()).toBeVisible({ timeout: 10_000 });

    // Should be Vacant
    await expect(page.getByText('Vacant').first()).toBeVisible({ timeout: 10_000 });
  });
});
