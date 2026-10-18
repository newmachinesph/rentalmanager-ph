import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const [recentIncome, recentMaintenance, recentLeases] = await Promise.all([
    prisma.incomeRecord.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { tenant: true, property: true } }),
    prisma.maintenanceRequest.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { property: true } }),
    prisma.lease.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { tenant: true, property: true } }),
  ]);

  const activities: { id: string; type: string; title: string; description: string; timestamp: string }[] = [];

  for (const r of recentIncome) {
    const tenantName = r.tenant ? `${r.tenant.firstName} ${r.tenant.lastName}` : 'Unknown tenant';
    const propName = r.property?.name ?? 'Unknown property';
    activities.push({
      id: r.id,
      type: 'payment',
      title: `Payment ${r.status === 'Paid' ? 'received' : r.status.toLowerCase()}`,
      description: `₱${r.amount.toLocaleString()} from ${tenantName} - ${propName}`,
      timestamp: r.createdAt.toISOString(),
    });
  }

  for (const r of recentMaintenance) {
    activities.push({
      id: r.id,
      type: 'maintenance',
      title: `Maintenance ${r.status.toLowerCase()}`,
      description: `${r.title} - ${r.property?.name ?? 'Unknown property'}`,
      timestamp: r.createdAt.toISOString(),
    });
  }

  for (const l of recentLeases) {
    const tenantName = l.tenant ? `${l.tenant.firstName} ${l.tenant.lastName}` : 'Unknown tenant';
    const propName = l.property?.name ?? 'Unknown property';
    activities.push({
      id: l.id,
      type: 'lease',
      title: `Lease ${l.status.toLowerCase()}`,
      description: `${tenantName} - ${propName}`,
      timestamp: l.createdAt.toISOString(),
    });
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json(activities.slice(0, 10));
}
