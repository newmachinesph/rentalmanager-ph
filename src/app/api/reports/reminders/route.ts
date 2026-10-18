import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: Record<string, unknown> = {};
  if (propertyId && propertyId !== 'all') where.propertyId = propertyId;
  if (startDate || endDate) {
    where.dateTime = {};
    if (startDate) (where.dateTime as Record<string,string>).gte = startDate;
    if (endDate) (where.dateTime as Record<string,string>).lte = endDate;
  }

  const entries = await prisma.orgReminder.findMany({ where, include: { property: true }, orderBy: { dateTime: 'asc' } });
  return NextResponse.json({ entries });
}
