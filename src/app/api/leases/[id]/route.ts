import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
  return NextResponse.json(lease);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate dates if both provided
  const startDate = body.startDate;
  const endDate = body.endDate;
  if (startDate && endDate && endDate <= startDate) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  }

  // Validate amounts
  if (body.monthlyRent != null && body.monthlyRent <= 0) {
    return NextResponse.json({ error: 'Monthly rent must be positive' }, { status: 400 });
  }
  if (body.securityDeposit != null && body.securityDeposit < 0) {
    return NextResponse.json({ error: 'Security deposit cannot be negative' }, { status: 400 });
  }
  if (body.advancePayment != null && body.advancePayment < 0) {
    return NextResponse.json({ error: 'Advance payment cannot be negative' }, { status: 400 });
  }

  // Fetch existing record for fallback and validation
  const existing = await prisma.lease.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Lease not found' }, { status: 404 });

  // If dates or unit changed, check for overlapping leases
  if (body.unitId || startDate || endDate) {
    const checkUnit = body.unitId || existing.unitId;
    const checkStart = startDate || existing.startDate;
    const checkEnd = endDate || existing.endDate;

    const overlapping = await prisma.lease.findFirst({
      where: {
        id: { not: id },
        unitId: checkUnit,
        status: { in: ['Active', 'Pending'] },
        startDate: { lt: checkEnd },
        endDate: { gt: checkStart },
      },
    });
    if (overlapping) {
      return NextResponse.json({ error: 'This unit already has an active lease for the specified dates' }, { status: 409 });
    }
  }

  // Validate status transitions
  const VALID_STATUSES = ['Active', 'Pending', 'Expired', 'Terminated'];
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  try {
    const lease = await prisma.lease.update({
      where: { id },
      data: {
        propertyId: body.propertyId ?? existing.propertyId,
        unitId: body.unitId ?? existing.unitId,
        tenantId: body.tenantId ?? existing.tenantId,
        startDate: body.startDate ?? existing.startDate,
        endDate: body.endDate ?? existing.endDate,
        monthlyRent: body.monthlyRent ?? existing.monthlyRent,
        securityDeposit: body.securityDeposit ?? undefined,
        advancePayment: body.advancePayment ?? undefined,
        paymentDueDay: body.paymentDueDay ?? undefined,
        status: body.status ?? existing.status,
        notes: body.notes ?? undefined,
      },
    });

    // Sync unit status when lease status changes
    if (body.status && body.status !== existing.status) {
      if (body.status === 'Active') {
        await prisma.unit.update({ where: { id: lease.unitId }, data: { status: 'Occupied' } });
      } else if (existing.status === 'Active' && ['Expired', 'Terminated'].includes(body.status)) {
        // Check if unit has any other active leases before setting to Vacant
        const otherActive = await prisma.lease.findFirst({
          where: { unitId: lease.unitId, id: { not: id }, status: 'Active' },
        });
        if (!otherActive) {
          await prisma.unit.update({ where: { id: lease.unitId }, data: { status: 'Vacant' } });
        }
      }
    }

    return NextResponse.json(lease);
  } catch {
    return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 });

    // Check for associated income records
    const incomeCount = await prisma.incomeRecord.count({ where: { leaseId: id } });
    if (incomeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete lease with ${incomeCount} payment record(s). Delete the payments first or terminate the lease instead.` },
        { status: 409 }
      );
    }

    await prisma.lease.delete({ where: { id } });

    // If the deleted lease was Active, set unit to Vacant if no other active leases
    if (lease.status === 'Active') {
      const otherActive = await prisma.lease.findFirst({
        where: { unitId: lease.unitId, status: 'Active' },
      });
      if (!otherActive) {
        await prisma.unit.update({ where: { id: lease.unitId }, data: { status: 'Vacant' } });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete lease' }, { status: 500 });
  }
}
