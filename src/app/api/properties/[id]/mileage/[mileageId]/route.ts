import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; mileageId: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { mileageId } = await params;
  const mileage = await prisma.propertyMileage.findUnique({ where: { id: mileageId } });
  if (!mileage) {
    return NextResponse.json({ error: 'Mileage record not found' }, { status: 404 });
  }
  return NextResponse.json(mileage);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; mileageId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { mileageId } = await params;
  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const mileage = await prisma.propertyMileage.update({
      where: { id: mileageId },
      data: updates,
    });
    return NextResponse.json(mileage);
  } catch {
    return NextResponse.json({ error: 'Mileage record not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; mileageId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { mileageId } = await params;
  try {
    await prisma.propertyMileage.delete({ where: { id: mileageId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Mileage record not found' }, { status: 404 });
  }
}
