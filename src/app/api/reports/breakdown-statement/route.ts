import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const properties = await prisma.property.findMany();

  const incomeWhere: Prisma.IncomeRecordWhereInput = {
    status: 'Paid',
    ...(from || to ? {
      dueDate: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    } : {}),
  };
  const expenseWhere: Prisma.ExpenseRecordWhereInput = {
    ...(from || to ? {
      date: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      },
    } : {}),
  };

  const [allIncome, allExpenses] = await Promise.all([
    prisma.incomeRecord.findMany({ where: incomeWhere }),
    prisma.expenseRecord.findMany({ where: expenseWhere }),
  ]);

  const result = properties.map(p => {
    const income = allIncome.filter(r => r.propertyId === p.id).reduce((s, r) => s + r.amount, 0);
    const expense = allExpenses.filter(r => r.propertyId === p.id).reduce((s, r) => s + r.amount, 0);
    return { propertyName: p.name, income, expense };
  });

  return NextResponse.json({ properties: result });
}
