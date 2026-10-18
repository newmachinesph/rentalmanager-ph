import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const leases = await prisma.lease.findMany({
    where: { status: 'Active' },
    include: { tenant: true, property: true, unit: true },
  });

  const entries = leases.map(l => ({
    property: l.property.name,
    unit: l.unit.name,
    tenant: `${l.tenant.firstName} ${l.tenant.lastName}`,
    monthlyRent: l.monthlyRent,
    leaseEnd: l.endDate,
  }));

  return NextResponse.json({ entries });
}
