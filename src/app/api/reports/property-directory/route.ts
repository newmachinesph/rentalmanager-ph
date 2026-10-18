import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const properties = await prisma.property.findMany({ include: { units: true } });
  return NextResponse.json({ properties });
}
