import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const expenses = await prisma.expenseRecord.findMany();

  const vendorMap = new Map<string, { totalAmount: number; count: number; categories: Set<string> }>();
  expenses.forEach(r => {
    const entry = vendorMap.get(r.vendor) || { totalAmount: 0, count: 0, categories: new Set<string>() };
    entry.totalAmount += r.amount;
    entry.count += 1;
    entry.categories.add(r.category);
    vendorMap.set(r.vendor, entry);
  });

  const suppliers = Array.from(vendorMap.entries()).map(([vendor, v]) => ({
    vendor, totalAmount: v.totalAmount, count: v.count, categories: Array.from(v.categories),
  }));

  return NextResponse.json({ suppliers });
}
