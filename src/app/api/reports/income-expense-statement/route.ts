import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const incomeWhere: Prisma.IncomeRecordWhereInput = {
    status: 'Paid',
    ...(propertyId ? { propertyId } : {}),
    ...(from || to ? {
      dueDate: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    } : {}),
  };
  const expenseWhere: Prisma.ExpenseRecordWhereInput = {
    ...(propertyId ? { propertyId } : {}),
    ...(from || to ? {
      date: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    } : {}),
  };

  const [income, expenses] = await Promise.all([
    prisma.incomeRecord.findMany({ where: incomeWhere }),
    prisma.expenseRecord.findMany({ where: expenseWhere }),
  ]);

  const categoryMap = new Map<string, { income: number; expense: number }>();
  income.forEach(r => {
    const entry = categoryMap.get(r.category) || { income: 0, expense: 0 };
    entry.income += r.amount;
    categoryMap.set(r.category, entry);
  });
  expenses.forEach(r => {
    const entry = categoryMap.get(r.category) || { income: 0, expense: 0 };
    entry.expense += r.amount;
    categoryMap.set(r.category, entry);
  });

  const rows = Array.from(categoryMap.entries()).map(([category, vals]) => ({
    category, income: vals.income, expense: vals.expense,
  }));

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);

  return NextResponse.json({ rows, totals: { totalIncome, totalExpense, net: totalIncome - totalExpense } });
}
