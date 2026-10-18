import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const entries = await prisma.maintenanceRequest.findMany({
    include: { property: true, unit: true, tenant: true },
  });

  const summary = {
    open: entries.filter(r => r.status === 'Open').length,
    inProgress: entries.filter(r => r.status === 'In Progress').length,
    completed: entries.filter(r => r.status === 'Completed').length,
  };

  return NextResponse.json({ entries, summary });
}
