import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const expenses = await prisma.expenseRecord.findMany();

  const vendorMap = new Map<string, { phone: string; email: string; expenseCount: number }>();
  expenses.forEach(r => {
    const entry = vendorMap.get(r.vendor) || { phone: '', email: '', expenseCount: 0 };
    entry.expenseCount += 1;
    vendorMap.set(r.vendor, entry);
  });

  const suppliers = Array.from(vendorMap.entries()).map(([name, v]) => ({
    name, phone: v.phone, email: v.email, expenseCount: v.expenseCount,
  }));

  return NextResponse.json({ suppliers });
}
