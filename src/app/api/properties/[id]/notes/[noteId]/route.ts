import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { noteId } = await params;
  const note = await prisma.propertyNote.findUnique({ where: { id: noteId } });
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json(note);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { noteId } = await params;
  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const note = await prisma.propertyNote.update({
      where: { id: noteId },
      data: updates,
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { noteId } = await params;
  try {
    await prisma.propertyNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
}
