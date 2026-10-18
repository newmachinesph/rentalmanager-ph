import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const mileage = await prisma.propertyMileage.findMany({ where: { propertyId: id } });
  return NextResponse.json(mileage);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const mileage = await prisma.propertyMileage.create({
    data: {
      propertyId: id,
      date: body.date,
      startLocation: body.startLocation || '',
      endLocation: body.endLocation || '',
      purpose: body.purpose || '',
      distance: body.distance || 0,
    },
  });
  return NextResponse.json(mileage, { status: 201 });
}
