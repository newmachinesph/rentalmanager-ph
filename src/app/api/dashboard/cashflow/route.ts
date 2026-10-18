import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const [incomeRecords, expenseRecords] = await Promise.all([
    prisma.incomeRecord.findMany({ where: { status: 'Paid' } }),
    prisma.expenseRecord.findMany(),
  ]);

  // Build monthly cashflow for the last 12 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const cashflow = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthIncome = incomeRecords
      .filter(r => r.paidDate && r.paidDate.startsWith(prefix))
      .reduce((s, r) => s + r.amount, 0);
    const monthExpense = expenseRecords
      .filter(r => r.date.startsWith(prefix))
      .reduce((s, r) => s + r.amount, 0);

    cashflow.push({ month: months[month], income: monthIncome, expenses: monthExpense });
  }

  return NextResponse.json(cashflow);
}
