import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'All';
  const priority = searchParams.get('priority') || 'All';
  const propertyId = searchParams.get('propertyId');

  const where: Prisma.MaintenanceRequestWhereInput = {};
  if (status !== 'All') where.status = status;
  if (priority !== 'All') where.priority = priority;
  if (propertyId) where.propertyId = propertyId;

  try {
    const data = await prisma.maintenanceRequest.findMany({
      where,
      include: { property: true, unit: true, tenant: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ data, total: data.length });
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

  if (!body.propertyId || !body.unitId || !body.title || !body.category || !body.dateReported) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const req = await prisma.maintenanceRequest.create({
    data: {
      propertyId: body.propertyId,
      unitId: body.unitId,
      tenantId: body.tenantId || null,
      title: body.title,
      description: body.description || '',
      category: body.category,
      priority: body.priority || 'Medium',
      status: body.status || 'Open',
      dateReported: body.dateReported,
      dateCompleted: body.dateCompleted || null,
      estimatedCost: body.estimatedCost || 0,
      actualCost: body.actualCost || null,
      contractor: body.contractor || '',
      contractorPhone: body.contractorPhone || '',
      notes: body.notes || '',
    },
    include: { property: true, unit: true, tenant: true },
  });
  return NextResponse.json(req, { status: 201 });
}
