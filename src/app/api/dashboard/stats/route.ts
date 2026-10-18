import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  const propertyWhere = propertyId ? { id: propertyId } : {};
  const recordWhere = propertyId ? { propertyId } : {};

  const [properties, units, tenantCount, activeLeases, paidIncome, expenses, pendingMaintenance, overduePayments] = await Promise.all([
    prisma.property.findMany({ where: propertyWhere, include: { units: true } }),
    prisma.unit.findMany({ where: propertyId ? { propertyId } : {} }),
    prisma.tenant.count(),
    prisma.lease.count({ where: { ...recordWhere, status: 'Active' } }),
    prisma.incomeRecord.aggregate({ where: { ...recordWhere, status: 'Paid' }, _sum: { amount: true } }),
    prisma.expenseRecord.aggregate({ where: recordWhere, _sum: { amount: true } }),
    prisma.maintenanceRequest.count({ where: { ...recordWhere, status: { in: ['Open', 'In Progress'] } } }),
    prisma.incomeRecord.count({ where: { ...recordWhere, status: 'Overdue' } }),
  ]);

  const totalIncome = paidIncome._sum.amount || 0;
  const totalExpenses = expenses._sum.amount || 0;
  const occupiedUnits = units.filter(u => u.status === 'Occupied').length;

  // Compute month-over-month change for income and expenses
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [thisMonthIncome, lastMonthIncome, thisMonthExpenses, lastMonthExpenses] = await Promise.all([
    prisma.incomeRecord.aggregate({ where: { ...recordWhere, status: 'Paid', paidDate: { gte: thisMonthStart } }, _sum: { amount: true } }),
    prisma.incomeRecord.aggregate({ where: { ...recordWhere, status: 'Paid', paidDate: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { amount: true } }),
    prisma.expenseRecord.aggregate({ where: { ...recordWhere, date: { gte: thisMonthStart } }, _sum: { amount: true } }),
    prisma.expenseRecord.aggregate({ where: { ...recordWhere, date: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { amount: true } }),
  ]);

  const thisIncome = thisMonthIncome._sum.amount || 0;
  const lastIncome = lastMonthIncome._sum.amount || 0;
  const thisExp = thisMonthExpenses._sum.amount || 0;
  const lastExp = lastMonthExpenses._sum.amount || 0;

  const incomeChange = lastIncome > 0 ? Math.round(((thisIncome - lastIncome) / lastIncome) * 100) : 0;
  const expenseChange = lastExp > 0 ? Math.round(((thisExp - lastExp) / lastExp) * 100) : 0;

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    occupancyRate: units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0,
    totalProperties: properties.length,
    totalUnits: units.length,
    totalTenants: tenantCount,
    activeLeases,
    pendingMaintenance,
    overduePayments,
    incomeChange,
    expenseChange,
  });
}
