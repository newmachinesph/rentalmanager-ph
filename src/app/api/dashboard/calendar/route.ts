import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  const [incomeRecords, leases, maintenanceRequests] = await Promise.all([
    prisma.incomeRecord.findMany({
      where: { dueDate: { startsWith: month }, category: 'Rent' },
    }),
    prisma.lease.findMany({
      where: { endDate: { startsWith: month } },
    }),
    prisma.maintenanceRequest.findMany({
      where: { dateReported: { startsWith: month }, status: { in: ['Open', 'In Progress'] } },
    }),
  ]);

  const events: { id: string; title: string; date: string; type: string }[] = [];

  // Rent due dates
  for (const r of incomeRecords) {
    events.push({ id: `rent-${r.id}`, title: 'Rent due', date: r.dueDate, type: 'rent-due' });
  }

  // Lease expiries
  for (const l of leases) {
    events.push({ id: `lease-${l.id}`, title: 'Lease expires', date: l.endDate, type: 'lease-expiry' });
  }

  // Maintenance
  for (const r of maintenanceRequests) {
    events.push({ id: `maint-${r.id}`, title: r.title, date: r.dateReported, type: 'maintenance' });
  }

  return NextResponse.json(events);
}
