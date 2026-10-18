import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const mileage = await prisma.orgMileage.findUnique({ where: { id }, include: { property: true } });
  if (!mileage) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(mileage);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  // Handle propertyId updates: disconnect if "Organization" or empty, connect otherwise
  if ('propertyId' in updates) {
    const propertyId = updates.propertyId && updates.propertyId !== 'Organization' ? updates.propertyId : null;
    delete updates.propertyId;
    if (propertyId) {
      updates.property = { connect: { id: propertyId } };
    } else {
      updates.property = { disconnect: true };
    }
  }
  const mileage = await prisma.orgMileage.update({ where: { id }, data: updates });
  return NextResponse.json(mileage);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  await prisma.orgMileage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
