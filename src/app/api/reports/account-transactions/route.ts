import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  const where = propertyId ? { propertyId } : {};

  const [income, expenses] = await Promise.all([
    prisma.incomeRecord.findMany({ where: { ...where, status: 'Paid' } }),
    prisma.expenseRecord.findMany({ where }),
  ]);

  const transactions: { date: string; description: string; amount: number; balance: number }[] = [];
  let balance = 0;

  const all = [
    ...income.map(r => ({ date: r.paidDate || r.dueDate, description: `Income: ${r.category}`, amount: r.amount })),
    ...expenses.map(r => ({ date: r.date, description: `Expense: ${r.category}`, amount: -r.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  all.forEach(t => {
    balance += t.amount;
    transactions.push({ ...t, balance });
  });

  return NextResponse.json({ transactions });
}
