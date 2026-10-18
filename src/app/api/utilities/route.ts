import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const unitId = searchParams.get('unitId');
  const utilityType = searchParams.get('utilityType');
  const isPaid = searchParams.get('isPaid');

  const where: Prisma.UtilityReadingWhereInput = {};
  if (propertyId) where.propertyId = propertyId;
  if (unitId) where.unitId = unitId;
  if (utilityType && utilityType !== 'All') where.utilityType = utilityType;
  if (isPaid === 'true') where.isPaid = true;
  if (isPaid === 'false') where.isPaid = false;

  try {
    const data = await prisma.utilityReading.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data, total: data.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch utility readings' }, { status: 500 });
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

  if (!body.propertyId || !body.utilityType || !body.readingDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const previousReading = body.previousReading ?? 0;
  const currentReading = body.currentReading ?? 0;
  const consumption = currentReading - previousReading;
  const ratePerUnit = body.ratePerUnit ?? 0;
  const amount = consumption * ratePerUnit;

  try {
    const record = await prisma.utilityReading.create({
      data: {
        propertyId: body.propertyId,
        unitId: body.unitId || null,
        utilityType: body.utilityType,
        readingDate: body.readingDate,
        previousReading,
        currentReading,
        consumption,
        ratePerUnit,
        amount,
        isPaid: body.isPaid ?? false,
        paidDate: body.paidDate || null,
        notes: body.notes || '',
      },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create utility reading' }, { status: 500 });
  }
}
