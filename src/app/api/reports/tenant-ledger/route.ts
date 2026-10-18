import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const records = await prisma.incomeRecord.findMany({
    where: { tenantId },
    orderBy: { dueDate: 'asc' },
  });

  let balance = 0;
  const entries = records.map(r => {
    const amountPaid = r.status === 'Paid' ? r.amount : 0;
    balance += r.amount - amountPaid;
    return {
      dueDate: r.dueDate,
      category: r.category,
      amountDue: r.amount,
      amountPaid,
      balance,
    };
  });

  return NextResponse.json({ entries });
}
