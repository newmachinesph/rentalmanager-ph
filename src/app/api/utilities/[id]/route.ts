import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const record = await prisma.utilityReading.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true } },
    },
  });
  if (!record) return NextResponse.json({ error: 'Utility reading not found' }, { status: 404 });
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

  try {
    const existing = await prisma.utilityReading.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Utility reading not found' }, { status: 404 });

    const previousReading = body.previousReading ?? existing.previousReading;
    const currentReading = body.currentReading ?? existing.currentReading;
    const consumption = currentReading - previousReading;
    const ratePerUnit = body.ratePerUnit ?? existing.ratePerUnit;
    const amount = consumption * ratePerUnit;

    const record = await prisma.utilityReading.update({
      where: { id },
      data: {
        propertyId: body.propertyId ?? existing.propertyId,
        unitId: body.unitId ?? undefined,
        utilityType: body.utilityType ?? existing.utilityType,
        readingDate: body.readingDate ?? existing.readingDate,
        previousReading,
        currentReading,
        consumption,
        ratePerUnit,
        amount,
        isPaid: body.isPaid ?? existing.isPaid,
        paidDate: body.paidDate ?? undefined,
        notes: body.notes ?? undefined,
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: 'Utility reading not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    await prisma.utilityReading.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Utility reading not found' }, { status: 404 });
  }
}
