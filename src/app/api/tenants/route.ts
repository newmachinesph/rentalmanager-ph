import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  const where: Prisma.TenantWhereInput = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const data = await prisma.tenant.findMany({ where, orderBy: { createdAt: 'desc' } });
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

  const isCompany = body.tenantType === 'Company';
  if (isCompany) {
    if (!body.firstName || !body.email || !body.phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
  } else {
    if (!body.firstName || !body.lastName || !body.email || !body.phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
  }

  const tenant = await prisma.tenant.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      emergencyContact: body.emergencyContact || '',
      emergencyPhone: body.emergencyPhone || '',
      idType: body.idType || '',
      idNumber: body.idNumber || '',
      occupation: body.occupation || '',
      employer: body.employer || '',
      avatar: body.avatar || null,
      notes: body.notes || '',
      dateOfBirth: body.dateOfBirth || '',
      tenantType: body.tenantType || 'Person',
    },
  });
  return NextResponse.json(tenant, { status: 201 });
}
