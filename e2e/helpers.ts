import { Page } from '@playwright/test';

/** Wait for the page to be fully loaded (domcontentloaded + brief settle). */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

/** Navigate to a path and wait for load. */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForPageLoad(page);
}

/** Generate a unique name with timestamp suffix. */
export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}`;
}
