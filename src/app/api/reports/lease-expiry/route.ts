import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const today = new Date();
  const leases = await prisma.lease.findMany({
    where: { status: 'Active' },
    include: { tenant: true, unit: true },
  });

  const entries = leases
    .map(l => {
      const daysRemaining = Math.floor((new Date(l.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        tenant: `${l.tenant.firstName} ${l.tenant.lastName}`,
        unit: l.unit.name,
        leaseEnd: l.endDate,
        daysRemaining: Math.max(0, daysRemaining),
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return NextResponse.json({ entries });
}
