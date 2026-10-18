import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'All';
  const propertyId = searchParams.get('propertyId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: Prisma.ExpenseRecordWhereInput = {};
  if (category !== 'All') where.category = category;
  if (propertyId) where.propertyId = propertyId;
  if (from || to) {
    where.date = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  try {
    const data = await prisma.expenseRecord.findMany({ where, orderBy: { createdAt: 'desc' } });

    const totalAmount = data.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({ data, total: data.length, summary: { totalAmount } });
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

  if (!body.propertyId || !body.category || !body.amount || !body.date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (body.amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  const record = await prisma.expenseRecord.create({
    data: {
      propertyId: body.propertyId,
      unitId: body.unitId || null,
      category: body.category,
      amount: body.amount,
      date: body.date,
      vendor: body.vendor || '',
      description: body.description || '',
      receiptUrl: body.receiptUrl || null,
      notes: body.notes || '',
    },
  });
  return NextResponse.json(record, { status: 201 });
}
