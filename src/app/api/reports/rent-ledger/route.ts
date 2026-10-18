import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const records = await prisma.incomeRecord.findMany({
    where: { category: 'Rent' },
    include: { tenant: true, unit: true },
  });

  const entries = records.map(r => {
    const amountPaid = r.status === 'Paid' ? r.amount : 0;
    return {
      tenant: r.tenant ? `${r.tenant.firstName} ${r.tenant.lastName}` : 'Unknown',
      unit: r.unit?.name ?? 'N/A',
      dueDate: r.dueDate,
      amountDue: r.amount,
      amountPaid,
      balance: r.amount - amountPaid,
    };
  });

  return NextResponse.json({ entries });
}
