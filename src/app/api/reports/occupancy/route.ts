import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const properties = await prisma.property.findMany({ include: { units: true } });

  const result = properties.map(p => {
    const totalUnits = p.units.length;
    const occupied = p.units.filter(u => u.status === 'Occupied').length;
    const vacant = totalUnits - occupied;
    return {
      name: p.name,
      totalUnits,
      occupied,
      vacant,
      rate: totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0,
    };
  });

  return NextResponse.json({ properties: result });
}
