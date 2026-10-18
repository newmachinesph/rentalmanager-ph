import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const reminders = await prisma.orgReminder.findMany({ where: { propertyId: id } });
  return NextResponse.json(reminders);
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
  const reminder = await prisma.orgReminder.create({
    data: {
      propertyId: id,
      dateTime: body.dateTime,
      category: body.category || '',
      notes: body.notes || '',
      isRecurring: body.isRecurring || false,
    },
  });
  return NextResponse.json(reminder, { status: 201 });
}
