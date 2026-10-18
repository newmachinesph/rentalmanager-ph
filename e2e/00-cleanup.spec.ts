/**
 * Cleanup -- wipe all application data EXCEPT user accounts and settings.
 * Runs FIRST (alphabetical order) to guarantee a clean slate for every test run.
 *
 * Calls each entity's API DELETE or uses a dedicated cleanup endpoint.
 * Falls back to deleting records one-by-one via the API since we don't have
 * a bulk-delete endpoint.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000/api';

/**
 * Helper: fetch with the admin session cookie from storage state.
 */
async function apiFetch(request: import('@playwright/test').APIRequestContext, method: string, path: string, body?: unknown) {
  const opts: Record<string, unknown> = { failOnStatusCode: false };
  if (body) opts.data = body;
  if (method === 'GET') return request.get(`${BASE}${path}`, opts);
  if (method === 'DELETE') return request.delete(`${BASE}${path}`, opts);
  if (method === 'POST') return request.post(`${BASE}${path}`, opts);
  return request.get(`${BASE}${path}`, opts);
}

async function deleteAll(request: import('@playwright/test').APIRequestContext, listPath: string, idPath: (id: string) => string) {
  const res = await apiFetch(request, 'GET', listPath);
  if (!res.ok()) return;
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.data || []);
  for (const item of items) {
    await apiFetch(request, 'DELETE', idPath(item.id));
  }
}

test.describe('Cleanup -- wipe all data except accounts/settings', () => {
  test('delete all contracts', async ({ request }) => {
    await deleteAll(request, '/contracts', (id) => `/contracts/${id}`);
  });

  test('delete all income records', async ({ request }) => {
    await deleteAll(request, '/income', (id) => `/income/${id}`);
  });

  test('delete all expense records', async ({ request }) => {
    await deleteAll(request, '/expenses', (id) => `/expenses/${id}`);
  });

  test('delete all maintenance requests', async ({ request }) => {
    await deleteAll(request, '/maintenance', (id) => `/maintenance/${id}`);
  });

  test('delete all utility readings', async ({ request }) => {
    await deleteAll(request, '/utilities', (id) => `/utilities/${id}`);
  });

  test('delete all leases', async ({ request }) => {
    await deleteAll(request, '/leases', (id) => `/leases/${id}`);
  });

  test('delete all tenants', async ({ request }) => {
    await deleteAll(request, '/tenants', (id) => `/tenants/${id}`);
  });

  test('delete all properties (cascades units, docs, contacts, notes, mileage)', async ({ request }) => {
    await deleteAll(request, '/properties', (id) => `/properties/${id}`);
  });

  test('delete all organization data', async ({ request }) => {
    await deleteAll(request, '/organization/reminders', (id) => `/organization/reminders/${id}`);
    await deleteAll(request, '/organization/mileage', (id) => `/organization/mileage/${id}`);
    await deleteAll(request, '/organization/notes', (id) => `/organization/notes/${id}`);
    await deleteAll(request, '/organization/documents', (id) => `/organization/documents/${id}`);
  });

  test('verify clean state -- no properties', async ({ request }) => {
    const res = await apiFetch(request, 'GET', '/properties');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.data || []);
    expect(items.length).toBe(0);
  });

  test('verify clean state -- no tenants', async ({ request }) => {
    const res = await apiFetch(request, 'GET', '/tenants');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.data || []);
    expect(items.length).toBe(0);
  });
});
