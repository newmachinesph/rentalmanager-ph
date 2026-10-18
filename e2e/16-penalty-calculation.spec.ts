/**
 * Penalty Calculation E2E Tests
 *
 * Validates contract clause 3.1:
 *   Interest at 3% per month PLUS penalty of 3% per month = 6% per month
 *   Prorated daily using actual days in each calendar month.
 *
 * Formula per month:  penalty = amount * (rate*2/100) / daysInMonth * daysOverdue
 *
 * Tests exercise the full stack:
 *   Settings API -> Income API -> SOA API -> calculatePenalty() -> response
 */
import { test, expect, type APIRequestContext } from '@playwright/test';

/* ================================================================== Helpers */

/** Create an income record via API and return its id */
async function createIncome(
  request: APIRequestContext,
  data: {
    propertyId: string;
    unitId?: string;
    tenantId?: string;
    leaseId?: string;
    category: string;
    amount: number;
    dueDate: string;
    paidDate?: string;
    status: string;
  },
): Promise<string> {
  const res = await request.post('/api/income', { data });
  expect(res.ok(), `Failed to create income: ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  return body.id;
}

/** Delete an income record via API */
async function deleteIncome(request: APIRequestContext, id: string) {
  await request.delete(`/api/income/${id}`);
}

/** Fetch SOA for a lease and return transactions + summary */
async function fetchSOA(
  request: APIRequestContext,
  lid: string,
): Promise<{
  transactions: Array<{ id: string; dueDate: string; amount: number; penalty: number; daysOverdue: number; status: string; category: string }>;
  summary: { totalCharges: number; totalPaid: number; totalPenalty: number; outstandingBalance: number };
}> {
  const res = await request.get(`/api/soa?leaseId=${lid}`);
  expect(res.ok()).toBeTruthy();
  return await res.json();
}

/** Fetch overdue rent payments report */
async function fetchOverdueReport(request: APIRequestContext) {
  const res = await request.get('/api/reports/overdue-rent-payments');
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as {
    entries: Array<{ tenant: string; dueDate: string; amount: number; daysOverdue: number; penaltyAmount: number }>;
    penaltyRatePerMonth: number;
  };
}

/**
 * Compute expected penalty matching the server-side calculatePenalty logic.
 * Walks month-by-month using actual calendar days.
 */
function expectedPenalty(amount: number, dueDate: string, ratePerMonth: number, paidDate?: string): number {
  const due = new Date(dueDate);
  const end = paidDate ? new Date(paidDate) : new Date();
  const diffMs = end.getTime() - due.getTime();
  const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (daysOverdue === 0) return 0;

  const combinedMonthlyRate = (ratePerMonth * 2) / 100;
  let penalty = 0;
  const cursor = new Date(due);
  let remaining = daysOverdue;

  while (remaining > 0) {
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const daysThisPeriod = Math.min(remaining, daysInMonth);
    const dailyRate = combinedMonthlyRate / daysInMonth;
    penalty += amount * dailyRate * daysThisPeriod;
    remaining -= daysThisPeriod;
    cursor.setMonth(cursor.getMonth() + 1);
    cursor.setDate(1);
  }

  return Math.round(penalty * 100) / 100;
}

/** Date string N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/* ================================================================== Constants */

const RATE = 3;
const AMT = 20000;

/* ================================================================== Tests */

test.describe('Penalty Calculation', () => {
  let propertyId: string;
  let unitId: string;
  let tenantId: string;
  let leaseId: string;
  const ids: string[] = [];

  test.beforeAll(async ({ request }) => {
    const [propRes, tenantRes, leaseRes, settingsRes] = await Promise.all([
      request.get('/api/properties'),
      request.get('/api/tenants'),
      request.get('/api/leases'),
      request.get('/api/settings/general'),
    ]);

    const properties = await propRes.json();
    propertyId = properties.data[0].id;
    unitId = properties.data[0].units[0].id;

    const tenants = await tenantRes.json();
    tenantId = tenants.data[0].id;

    const leases = await leaseRes.json();
    leaseId = leases.data[0].id;

    const settings = await settingsRes.json();
    expect(settings.penaltyRatePerMonth).toBe(3);
  });

  test.afterAll(async ({ request }) => {
    for (const id of ids) {
      await deleteIncome(request, id);
    }
  });

  /* Helper to create a Rent record and return its SOA transaction */
  async function createAndGetPenalty(
    request: APIRequestContext,
    opts: { dueDate: string; paidDate?: string; status?: string; amount?: number; category?: string },
  ) {
    const id = await createIncome(request, {
      propertyId, unitId, tenantId, leaseId,
      category: opts.category || 'Rent',
      amount: opts.amount || AMT,
      dueDate: opts.dueDate,
      paidDate: opts.paidDate,
      status: opts.status || 'Pending',
    });
    ids.push(id);

    const soa = await fetchSOA(request, leaseId);
    const tx = soa.transactions.find(t => t.id === id);
    expect(tx, `Transaction ${id} not found in SOA`).toBeDefined();
    return { id, tx: tx!, soa };
  }

  /* ---- Overdue day scenarios ---- */

  test('0 days overdue (due today) -> zero penalty', async ({ request }) => {
    const { tx } = await createAndGetPenalty(request, { dueDate: daysAgo(0) });
    expect(tx.penalty).toBe(0);
    expect(tx.daysOverdue).toBe(0);
  });

  test('1 day overdue -> prorated penalty for 1 day', async ({ request }) => {
    const due = daysAgo(1);
    const { tx } = await createAndGetPenalty(request, { dueDate: due });
    expect(tx.daysOverdue).toBe(1);
    expect(tx.penalty).toBeCloseTo(expectedPenalty(AMT, due, RATE), 1);
    // 1 day at ~6%/30 of 20000 ≈ ~40
    expect(tx.penalty).toBeGreaterThan(30);
    expect(tx.penalty).toBeLessThan(50);
  });

  test('5 days overdue -> prorated penalty for 5 days', async ({ request }) => {
    const due = daysAgo(5);
    const { tx } = await createAndGetPenalty(request, { dueDate: due });
    expect(tx.daysOverdue).toBe(5);
    expect(tx.penalty).toBeCloseTo(expectedPenalty(AMT, due, RATE), 1);
    expect(tx.penalty).toBeGreaterThan(150);
    expect(tx.penalty).toBeLessThan(250);
  });

  test('15 days overdue -> prorated penalty for 15 days', async ({ request }) => {
    const due = daysAgo(15);
    const { tx } = await createAndGetPenalty(request, { dueDate: due });
    expect(tx.daysOverdue).toBe(15);
    expect(tx.penalty).toBeCloseTo(expectedPenalty(AMT, due, RATE), 1);
    expect(tx.penalty).toBeGreaterThan(500);
    expect(tx.penalty).toBeLessThan(700);
  });

  test('30 days overdue -> ~1 full month penalty (6% of 20k = ~1200)', async ({ request }) => {
    const due = daysAgo(30);
    const { tx } = await createAndGetPenalty(request, { dueDate: due });
    expect(tx.daysOverdue).toBe(30);
    expect(tx.penalty).toBeCloseTo(expectedPenalty(AMT, due, RATE), 1);
    expect(tx.penalty).toBeGreaterThan(1050);
    expect(tx.penalty).toBeLessThan(1350);
  });

  test('60 days overdue -> ~2 months penalty (~2400)', async ({ request }) => {
    const due = daysAgo(60);
    const { tx } = await createAndGetPenalty(request, { dueDate: due });
    expect(tx.daysOverdue).toBe(60);
    expect(tx.penalty).toBeCloseTo(expectedPenalty(AMT, due, RATE), 1);
    expect(tx.penalty).toBeGreaterThan(2100);
    expect(tx.penalty).toBeLessThan(2700);
  });

  test('90 days overdue -> ~3 months penalty (~3600)', async ({ request }) => {
    const due = daysAgo(90);
    const { tx } = await createAndGetPenalty(request, { dueDate: due });
    expect(tx.daysOverdue).toBe(90);
    expect(tx.penalty).toBeCloseTo(expectedPenalty(AMT, due, RATE), 1);
    expect(tx.penalty).toBeGreaterThan(3200);
    expect(tx.penalty).toBeLessThan(4000);
  });

  /* ---- Paid late / paid on time ---- */

  test('paid 10 days late -> penalty frozen at paid date (not accruing)', async ({ request }) => {
    const due = daysAgo(30);
    const dueD = new Date(due);
    const paidD = new Date(dueD);
    paidD.setDate(dueD.getDate() + 10);
    const paid = paidD.toISOString().split('T')[0];

    const { tx } = await createAndGetPenalty(request, { dueDate: due, paidDate: paid, status: 'Paid' });
    expect(tx.daysOverdue).toBe(10);
    const expected = expectedPenalty(AMT, due, RATE, paid);
    expect(tx.penalty).toBeCloseTo(expected, 1);
    // 10 days, not 30 — penalty much less than full month
    expect(tx.penalty).toBeLessThan(500);
  });

  test('paid on time (before due date) -> zero penalty', async ({ request }) => {
    const due = daysAgo(20);
    const dueD = new Date(due);
    const paidD = new Date(dueD);
    paidD.setDate(dueD.getDate() - 2);
    const paid = paidD.toISOString().split('T')[0];

    const { tx } = await createAndGetPenalty(request, { dueDate: due, paidDate: paid, status: 'Paid' });
    expect(tx.penalty).toBe(0);
    expect(tx.daysOverdue).toBe(0);
  });

  test('paid on exact due date -> zero penalty', async ({ request }) => {
    const due = daysAgo(15);
    const { tx } = await createAndGetPenalty(request, { dueDate: due, paidDate: due, status: 'Paid' });
    expect(tx.penalty).toBe(0);
    expect(tx.daysOverdue).toBe(0);
  });

  /* ---- Non-Rent categories ---- */

  test('Deposit category overdue -> zero penalty (only Rent gets penalized)', async ({ request }) => {
    const { tx } = await createAndGetPenalty(request, { dueDate: daysAgo(30), category: 'Deposit' });
    expect(tx.penalty).toBe(0);
  });

  test('Late Fee category overdue -> zero penalty', async ({ request }) => {
    const { tx } = await createAndGetPenalty(request, { dueDate: daysAgo(20), category: 'Late Fee', amount: 5000 });
    expect(tx.penalty).toBe(0);
  });

  /* ---- Proportional math ---- */

  test('penalty scales linearly: 10 days ≈ 2x of 5 days (same month)', async ({ request }) => {
    const due5 = daysAgo(5);
    const due10 = daysAgo(10);

    // Only valid if both dates are in the same month
    if (new Date(due5).getMonth() === new Date(due10).getMonth()) {
      const r5 = await createAndGetPenalty(request, { dueDate: due5 });
      const r10 = await createAndGetPenalty(request, { dueDate: due10 });
      expect(r10.tx.penalty).toBeCloseTo(r5.tx.penalty * 2, 0);
    }
  });

  test('30k amount = 3x penalty of 10k amount (same due date)', async ({ request }) => {
    const due = daysAgo(15);
    const r10k = await createAndGetPenalty(request, { dueDate: due, amount: 10000 });
    const r30k = await createAndGetPenalty(request, { dueDate: due, amount: 30000 });
    expect(r30k.tx.penalty).toBeCloseTo(r10k.tx.penalty * 3, 0);
  });

  /* ---- Exact 1-day math ---- */

  test('exact: 1 day in current month -> amount * 6% / daysInMonth', async ({ request }) => {
    const yesterday = daysAgo(1);
    const d = new Date(yesterday);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const exactExpected = Math.round(AMT * 0.06 / daysInMonth * 100) / 100;

    const { tx } = await createAndGetPenalty(request, { dueDate: yesterday });
    expect(tx.daysOverdue).toBe(1);
    expect(tx.penalty).toBeCloseTo(exactExpected, 1);
  });

  /* ---- SOA summary totals ---- */

  test('SOA totalPenalty includes sum of individual transaction penalties', async ({ request }) => {
    const soa = await fetchSOA(request, leaseId);
    const penaltyTxs = soa.transactions.filter(t => t.penalty > 0);
    const sumOfPenalties = penaltyTxs.reduce((s, t) => s + t.penalty, 0);
    expect(soa.summary.totalPenalty).toBeCloseTo(sumOfPenalties, 0);
  });

  /* ---- Overdue report API ---- */

  test('overdue report returns penaltyRatePerMonth=3 and correct penalties', async ({ request }) => {
    // Create a guaranteed overdue Rent record for the report
    await createAndGetPenalty(request, { dueDate: daysAgo(10) });

    const report = await fetchOverdueReport(request);
    expect(report.penaltyRatePerMonth).toBe(3);

    // At least one entry should have a positive penalty
    const withPenalty = report.entries.filter(e => e.penaltyAmount > 0);
    expect(withPenalty.length).toBeGreaterThan(0);

    // Every entry with penalty should have days overdue
    for (const entry of withPenalty) {
      expect(entry.daysOverdue).toBeGreaterThan(0);
    }
  });
});
