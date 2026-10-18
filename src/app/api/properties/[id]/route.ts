import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id }, include: { units: true } });
  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  return NextResponse.json(property);
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
  try {
    const property = await prisma.property.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        type: body.type ?? undefined,
        address: body.address ?? undefined,
        city: body.city ?? undefined,
        province: body.province ?? undefined,
        zipCode: body.zipCode ?? undefined,
        barangay: body.barangay ?? undefined,
        image: body.image ?? undefined,
        monthlyTarget: body.monthlyTarget ?? undefined,
      },
      include: { units: true },
    });
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    // Guard: prevent deleting property with active leases
    const activeLeases = await prisma.lease.count({
      where: { propertyId: id, status: { in: ['Active', 'Pending'] } },
    });
    if (activeLeases > 0) {
      return NextResponse.json(
        { error: `Cannot delete property with ${activeLeases} active/pending lease(s). Terminate or expire leases first.` },
        { status: 409 }
      );
    }

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }
}
