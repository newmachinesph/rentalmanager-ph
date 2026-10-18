import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const mileageRecords = await prisma.orgMileage.findMany({ include: { property: true } });
  return NextResponse.json(mileageRecords);
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
  // If propertyId is "Organization" or empty, store as null (org-level mileage)
  const propertyId = body.propertyId && body.propertyId !== 'Organization' ? body.propertyId : null;
  try {
    const mileage = await prisma.orgMileage.create({
      data: {
        date: body.date,
        startLocation: body.startLocation || '',
        endLocation: body.endLocation || '',
        purpose: body.purpose || '',
        distance: body.distance || 0,
        ...(propertyId ? { property: { connect: { id: propertyId } } } : {}),
      },
    });
    return NextResponse.json(mileage, { status: 201 });
  } catch (err: unknown) {
    console.error('Error creating mileage:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create mileage', details: message }, { status: 500 });
  }
}
