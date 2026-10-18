import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'All';
  const propertyId = searchParams.get('propertyId');
  const category = searchParams.get('category');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: Prisma.IncomeRecordWhereInput = {};
  if (status !== 'All') where.status = status;
  if (propertyId) where.propertyId = propertyId;
  if (category) where.category = category;
  if (from || to) {
    where.dueDate = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await prisma.incomeRecord.findMany({ where, orderBy: { createdAt: 'desc' } });

    // Compute effective status at read time instead of writing to DB on every GET
    const enrichedData = data.map(r => {
      if (['Pending', 'Unpaid'].includes(r.status) && r.dueDate < today) {
        return { ...r, status: 'Overdue' };
      }
      return r;
    });

    const totalAmount = enrichedData.reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = enrichedData.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({ data: enrichedData, total: enrichedData.length, summary: { totalAmount, paidAmount } });
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

  if (!body.propertyId || !body.category || !body.amount || !body.dueDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (body.amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
  }

  // Auto-resolve leaseId and unitId from active lease when not provided
  let unitId = body.unitId || null;
  let leaseId = body.leaseId || null;
  const tenantId = body.tenantId || null;

  if ((!leaseId || !unitId) && tenantId && body.propertyId) {
    const lease = await prisma.lease.findFirst({
      where: {
        tenantId,
        propertyId: body.propertyId,
        status: 'Active',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (lease) {
      if (!leaseId) leaseId = lease.id;
      if (!unitId) unitId = lease.unitId;
    }
  }

  try {
    const record = await prisma.incomeRecord.create({
      data: {
        propertyId: body.propertyId,
        unitId,
        tenantId,
        leaseId,
        category: body.category,
        amount: body.amount,
        dueDate: body.dueDate,
        paidDate: body.paidDate || null,
        paymentMethod: body.paymentMethod || null,
        status: body.status || 'Pending',
        referenceNo: body.referenceNo || '',
        notes: body.notes || '',
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Failed to create income record:', error);
    return NextResponse.json({ error: 'Failed to create income record' }, { status: 500 });
  }
}
