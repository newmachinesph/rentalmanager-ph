import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const record = await prisma.incomeRecord.findUnique({ where: { id } });
  if (!record) return NextResponse.json({ error: 'Income record not found' }, { status: 404 });
  return NextResponse.json(record);
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

  if (body.amount != null && body.amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  try {
    const existing = await prisma.incomeRecord.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Income record not found' }, { status: 404 });

    const record = await prisma.incomeRecord.update({
      where: { id },
      data: {
        propertyId: body.propertyId ?? existing.propertyId,
        unitId: body.unitId || existing.unitId || null,
        tenantId: body.tenantId || existing.tenantId || null,
        leaseId: body.leaseId || existing.leaseId || null,
        category: body.category ?? existing.category,
        amount: body.amount ?? existing.amount,
        dueDate: body.dueDate ?? existing.dueDate,
        paidDate: body.paidDate ?? undefined,
        paymentMethod: body.paymentMethod ?? undefined,
        status: body.status ?? existing.status,
        referenceNo: body.referenceNo ?? undefined,
        notes: body.notes ?? undefined,
      },
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Income record not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    await prisma.incomeRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Income record not found' }, { status: 404 });
  }
}
