import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; reminderId: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { reminderId } = await params;
  const reminder = await prisma.orgReminder.findUnique({ where: { id: reminderId } });
  if (!reminder) {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
  }
  return NextResponse.json(reminder);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; reminderId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { reminderId } = await params;
  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const reminder = await prisma.orgReminder.update({
      where: { id: reminderId },
      data: updates,
    });
    return NextResponse.json(reminder);
  } catch {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; reminderId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { reminderId } = await params;
  try {
    await prisma.orgReminder.delete({ where: { id: reminderId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
  }
}
