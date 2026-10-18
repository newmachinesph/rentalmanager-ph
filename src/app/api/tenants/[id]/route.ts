import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  return NextResponse.json(tenant);
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
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        firstName: body.firstName ?? existing.firstName,
        lastName: body.lastName ?? existing.lastName,
        email: body.email ?? existing.email,
        phone: body.phone ?? existing.phone,
        emergencyContact: body.emergencyContact ?? undefined,
        emergencyPhone: body.emergencyPhone ?? undefined,
        idType: body.idType ?? undefined,
        idNumber: body.idNumber ?? undefined,
        occupation: body.occupation ?? undefined,
        employer: body.employer ?? undefined,
        avatar: body.avatar ?? undefined,
        notes: body.notes ?? undefined,
        dateOfBirth: body.dateOfBirth ?? undefined,
        tenantType: body.tenantType ?? undefined,
      },
    });
    return NextResponse.json(tenant);
  } catch {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    // Guard: prevent deleting tenant with active leases
    const activeLeases = await prisma.lease.count({
      where: { tenantId: id, status: { in: ['Active', 'Pending'] } },
    });
    if (activeLeases > 0) {
      return NextResponse.json(
        { error: `Cannot delete tenant with ${activeLeases} active/pending lease(s). Terminate or expire leases first.` },
        { status: 409 }
      );
    }

    await prisma.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
}
