import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { property: true, unit: true, tenant: true },
  });
  if (!req) return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
  return NextResponse.json(req);
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
    const existing = await prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });

    const req = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        propertyId: body.propertyId ?? existing.propertyId,
        unitId: body.unitId ?? existing.unitId,
        tenantId: body.tenantId ?? undefined,
        title: body.title ?? existing.title,
        description: body.description ?? undefined,
        category: body.category ?? existing.category,
        priority: body.priority ?? existing.priority,
        status: body.status ?? existing.status,
        dateReported: body.dateReported ?? existing.dateReported,
        dateCompleted: body.dateCompleted ?? undefined,
        estimatedCost: body.estimatedCost ?? undefined,
        actualCost: body.actualCost ?? undefined,
        contractor: body.contractor ?? undefined,
        contractorPhone: body.contractorPhone ?? undefined,
        notes: body.notes ?? undefined,
      },
      include: { property: true, unit: true, tenant: true },
    });
    return NextResponse.json(req);
  } catch {
    return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    await prisma.maintenanceRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Maintenance request not found' }, { status: 404 });
  }
}
