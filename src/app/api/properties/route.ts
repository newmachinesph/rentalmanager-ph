import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || 'All';

  const where: Prisma.PropertyWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (type !== 'All') where.type = type;

  try {
    const data = await prisma.property.findMany({ where, include: { units: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ data, total: data.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.name || !body.type || !body.address || !body.city || !body.province) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const property = await prisma.property.create({
    data: {
      name: body.name,
      type: body.type,
      address: body.address,
      city: body.city,
      province: body.province,
      zipCode: body.zipCode,
      barangay: body.barangay,
      image: body.image || null,
      monthlyTarget: body.monthlyTarget || 0,
    },
    include: { units: true },
  });
  return NextResponse.json(property, { status: 201 });
}
