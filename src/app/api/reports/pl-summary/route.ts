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
    const totalIncome = allIncome.filter(r => r.propertyId === p.id).reduce((s, r) => s + r.amount, 0);
    const totalExpense = allExpenses.filter(r => r.propertyId === p.id).reduce((s, r) => s + r.amount, 0);
    return { name: p.name, totalIncome, totalExpense, net: totalIncome - totalExpense };
  });

  return NextResponse.json({ properties: result });
}
