import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { contactId } = await params;
  const contact = await prisma.propertyContact.findUnique({ where: { id: contactId } });
  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
  return NextResponse.json(contact);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { contactId } = await params;
  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const contact = await prisma.propertyContact.update({
      where: { id: contactId },
      data: updates,
    });
    return NextResponse.json(contact);
  } catch {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; contactId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { contactId } = await params;
  try {
    await prisma.propertyContact.delete({ where: { id: contactId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
  }
}
