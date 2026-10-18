import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const [properties, allIncome, allExpenses] = await Promise.all([
    prisma.property.findMany(),
    prisma.incomeRecord.findMany({ where: { status: 'Paid' } }),
    prisma.expenseRecord.findMany(),
  ]);

  const result = properties.map(p => {
    const income = allIncome.filter(r => r.propertyId === p.id);
    const expenses = allExpenses.filter(r => r.propertyId === p.id);

    const categoryMap = new Map<string, { income: number; expense: number }>();
    income.forEach(r => {
      const e = categoryMap.get(r.category) || { income: 0, expense: 0 };
      e.income += r.amount;
      categoryMap.set(r.category, e);
    });
    expenses.forEach(r => {
      const e = categoryMap.get(r.category) || { income: 0, expense: 0 };
      e.expense += r.amount;
      categoryMap.set(r.category, e);
    });

    return {
      name: p.name,
      categories: Array.from(categoryMap.entries()).map(([category, v]) => ({ category, ...v })),
    };
  });

  return NextResponse.json({ properties: result });
}
