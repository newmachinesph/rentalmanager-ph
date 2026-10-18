import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';
import { calculatePenalty } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const leaseId = searchParams.get('leaseId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!leaseId) {
    return NextResponse.json({ error: 'leaseId is required' }, { status: 400 });
  }

  try {
    // Fetch penalty rate from settings
    const generalSetting = await prisma.setting.findUnique({ where: { key: 'general' } });
    const generalConfig = generalSetting ? JSON.parse(generalSetting.value) : {};
    const penaltyRatePerMonth: number = generalConfig.penaltyRatePerMonth ?? 3;

    // Fetch lease with related data
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        unit: true,
        tenant: true,
      },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Fetch all income records for this lease (status enriched at read time, no DB writes)
    const whereIncome: Record<string, unknown> = { leaseId };
    if (from || to) {
      whereIncome.dueDate = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const incomeRecords = await prisma.incomeRecord.findMany({
      where: whereIncome,
      orderBy: { dueDate: 'asc' },
    });

    // Enrich status at read time (same pattern as GET /api/income)
    const enrichedRecords = incomeRecords.map((r) => {
      if (['Pending', 'Unpaid'].includes(r.status) && r.dueDate < today) {
        return { ...r, status: 'Overdue' as const };
      }
      return r;
    });

    // Compute per-transaction penalty
    const transactions = enrichedRecords.map((r) => {
      let penalty = 0;
      let daysOverdue = 0;

      if (r.category === 'Rent') {
        if (r.status === 'Paid' && r.paidDate && r.paidDate > r.dueDate) {
          // Paid late — penalty frozen at paid date
          const result = calculatePenalty(r.amount, r.dueDate, penaltyRatePerMonth, r.paidDate);
          penalty = result.penaltyAmount;
          daysOverdue = result.daysOverdue;
        } else if (r.status !== 'Paid' && r.dueDate < today) {
          // Still unpaid and overdue — penalty accrues until today
          const result = calculatePenalty(r.amount, r.dueDate, penaltyRatePerMonth);
          penalty = result.penaltyAmount;
          daysOverdue = result.daysOverdue;
        }
      }

      return {
        id: r.id,
        dueDate: r.dueDate,
        category: r.category,
        amount: r.amount,
        status: r.status,
        paidDate: r.paidDate,
        paymentMethod: r.paymentMethod,
        referenceNo: r.referenceNo,
        penalty,
        daysOverdue,
      };
    });

    // Compute summary
    const totalCharges = enrichedRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = enrichedRecords
      .filter((r) => r.status === 'Paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalPartial = enrichedRecords
      .filter((r) => r.status === 'Partially Paid')
      .reduce((sum, r) => sum + r.amount, 0);
    const totalPenalty = transactions.reduce((sum, t) => sum + t.penalty, 0);
    const outstandingBalance = totalCharges + totalPenalty - totalPaid;

    return NextResponse.json({
      lease: {
        id: lease.id,
        startDate: lease.startDate,
        endDate: lease.endDate,
        monthlyRent: lease.monthlyRent,
        securityDeposit: lease.securityDeposit,
        advancePayment: lease.advancePayment,
        paymentDueDay: lease.paymentDueDay,
        status: lease.status,
      },
      property: {
        id: lease.property.id,
        name: lease.property.name,
        address: lease.property.address,
        city: lease.property.city,
        province: lease.property.province,
      },
      unit: lease.unit
        ? { id: lease.unit.id, name: lease.unit.name }
        : null,
      tenant: {
        id: lease.tenant.id,
        firstName: lease.tenant.firstName,
        lastName: lease.tenant.lastName,
        email: lease.tenant.email,
        phone: lease.tenant.phone,
      },
      transactions,
      summary: {
        totalCharges,
        totalPaid,
        totalPartial,
        totalPenalty,
        outstandingBalance,
      },
    });
  } catch (error) {
    console.error('Failed to generate SOA:', error);
    return NextResponse.json({ error: 'Failed to generate SOA' }, { status: 500 });
  }
}
