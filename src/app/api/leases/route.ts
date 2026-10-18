import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'All';
  const propertyId = searchParams.get('propertyId');
  const tenantId = searchParams.get('tenantId');

  const where: Prisma.LeaseWhereInput = {};
  if (status !== 'All') where.status = status;
  if (propertyId) where.propertyId = propertyId;
  if (tenantId) where.tenantId = tenantId;

  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await prisma.lease.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Compute effective status at read time instead of writing to DB on every GET
    const enrichedData = data.map(l => {
      if (l.status === 'Active' && l.endDate < today) {
        return { ...l, status: 'Expired' };
      }
      return l;
    });

    return NextResponse.json({ data: enrichedData, total: enrichedData.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.propertyId || !body.unitId || !body.tenantId || !body.startDate || !body.endDate || !body.monthlyRent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate dates: endDate must be after startDate
  if (body.endDate <= body.startDate) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  }

  // Validate amounts are positive
  if (body.monthlyRent <= 0) {
    return NextResponse.json({ error: 'Monthly rent must be positive' }, { status: 400 });
  }
  if (body.securityDeposit != null && body.securityDeposit < 0) {
    return NextResponse.json({ error: 'Security deposit cannot be negative' }, { status: 400 });
  }
  if (body.advancePayment != null && body.advancePayment < 0) {
    return NextResponse.json({ error: 'Advance payment cannot be negative' }, { status: 400 });
  }

  // Check for overlapping active leases on the same unit
  const overlapping = await prisma.lease.findFirst({
    where: {
      unitId: body.unitId,
      status: { in: ['Active', 'Pending'] },
      startDate: { lt: body.endDate },
      endDate: { gt: body.startDate },
    },
  });
  if (overlapping) {
    return NextResponse.json({ error: 'This unit already has an active lease for the specified dates' }, { status: 409 });
  }

  const lease = await prisma.lease.create({
    data: {
      propertyId: body.propertyId,
      unitId: body.unitId,
      tenantId: body.tenantId,
      startDate: body.startDate,
      endDate: body.endDate,
      monthlyRent: body.monthlyRent,
      securityDeposit: body.securityDeposit || 0,
      advancePayment: body.advancePayment || 0,
      paymentDueDay: body.paymentDueDay || 1,
      status: body.status || 'Active',
      notes: body.notes || '',
    },
  });

  // Sync unit status to Occupied if lease is Active
  if (lease.status === 'Active') {
    await prisma.unit.update({
      where: { id: body.unitId },
      data: { status: 'Occupied' },
    });
  }

  return NextResponse.json(lease, { status: 201 });
}
