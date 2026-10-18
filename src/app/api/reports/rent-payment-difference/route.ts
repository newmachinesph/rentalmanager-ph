import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const [leases, allIncome] = await Promise.all([
    prisma.lease.findMany({ where: { status: 'Active' }, include: { tenant: true, unit: true } }),
    prisma.incomeRecord.findMany({ where: { status: 'Paid', category: 'Rent' } }),
  ]);

  const entries = leases.map(l => {
    const paid = allIncome
      .filter(r => r.leaseId === l.id)
      .reduce((s, r) => s + r.amount, 0);

    return {
      tenant: `${l.tenant.firstName} ${l.tenant.lastName}`,
      unit: l.unit.name,
      expected: l.monthlyRent,
      actual: paid,
      difference: paid - l.monthlyRent,
    };
  });

  return NextResponse.json({ entries });
}
