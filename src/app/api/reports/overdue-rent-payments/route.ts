import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';
import { calculatePenalty } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  // Fetch penalty rate from settings
  const generalSetting = await prisma.setting.findUnique({ where: { key: 'general' } });
  const generalConfig = generalSetting ? JSON.parse(generalSetting.value) : {};
  const penaltyRatePerMonth: number = generalConfig.penaltyRatePerMonth ?? 3;

  const today = new Date().toISOString().split('T')[0];

  // Fetch records that are overdue (enriched at read time, no DB writes)
  const records = await prisma.incomeRecord.findMany({
    where: {
      OR: [
        { status: 'Overdue' },
        { status: { in: ['Pending', 'Unpaid'] }, dueDate: { lt: today } },
      ],
    },
    include: { tenant: true, unit: true },
  });

  const entries = records.map(r => {
    const daysOverdue = Math.floor((new Date(today).getTime() - new Date(r.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const days = Math.max(0, daysOverdue);

    // Calculate penalty only for Rent category
    let penaltyAmount = 0;
    if (r.category === 'Rent' && days > 0) {
      const result = calculatePenalty(r.amount, r.dueDate, penaltyRatePerMonth);
      penaltyAmount = result.penaltyAmount;
    }

    return {
      tenant: r.tenant ? `${r.tenant.firstName} ${r.tenant.lastName}` : 'Unknown',
      unit: r.unit?.name ?? 'N/A',
      dueDate: r.dueDate,
      amount: r.amount,
      daysOverdue: days,
      penaltyAmount,
    };
  });

  return NextResponse.json({ entries, penaltyRatePerMonth });
}
