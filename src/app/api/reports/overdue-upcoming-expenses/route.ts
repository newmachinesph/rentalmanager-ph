import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const today = new Date().toISOString().split('T')[0];

  const expenses = await prisma.expenseRecord.findMany({
    include: { property: { select: { name: true } } },
    orderBy: { date: 'asc' },
  });

  const entries = expenses.map(r => ({
    vendor: r.vendor,
    category: r.category,
    amount: r.amount,
    dueDate: r.date,
    property: r.property.name,
    status: r.date <= today ? 'Paid' : 'Upcoming',
  }));

  return NextResponse.json({ entries });
}
