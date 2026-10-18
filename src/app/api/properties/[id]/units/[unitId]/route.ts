import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; unitId: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { unitId } = await params;
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
  }
  return NextResponse.json(unit);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; unitId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { unitId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const VALID_UNIT_STATUSES = ['Vacant', 'Occupied', 'Under Maintenance', 'Reserved'] as const;
  if (body.status && !VALID_UNIT_STATUSES.includes(body.status as typeof VALID_UNIT_STATUSES[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_UNIT_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: {
        name: body.name ?? undefined,
        floor: body.floor ?? undefined,
        bedrooms: body.bedrooms ?? undefined,
        bathrooms: body.bathrooms ?? undefined,
        areaSqm: body.areaSqm ?? undefined,
        monthlyRent: body.monthlyRent ?? undefined,
        status: body.status ?? undefined,
      },
    });
    return NextResponse.json(unit);
  } catch {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; unitId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { unitId } = await params;

  // Cascade guard: prevent deletion if unit has active or pending leases
  const activeLeaseCount = await prisma.lease.count({
    where: {
      unitId,
      status: { in: ['Active', 'Pending'] },
    },
  });
  if (activeLeaseCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete unit with ${activeLeaseCount} active or pending lease(s). Please terminate or expire them first.` },
      { status: 409 }
    );
  }

  try {
    await prisma.unit.delete({ where: { id: unitId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
  }
}
