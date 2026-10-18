import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const reminders = await prisma.orgReminder.findMany({ include: { property: true } });
  return NextResponse.json(reminders);
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
  // If propertyId is "Organization" or empty, store as null (org-level reminder)
  const propertyId = body.propertyId && body.propertyId !== 'Organization' ? body.propertyId : null;
  try {
    const reminder = await prisma.orgReminder.create({
      data: {
        dateTime: body.dateTime,
        category: body.category || '',
        notes: body.notes || '',
        isRecurring: body.isRecurring || false,
        ...(propertyId ? { property: { connect: { id: propertyId } } } : {}),
      },
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (err: unknown) {
    console.error('Error creating reminder:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create reminder', details: message }, { status: 500 });
  }
}
