import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { docId } = await params;
  const document = await prisma.propertyDocument.findUnique({ where: { id: docId } });
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  return NextResponse.json(document);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { docId } = await params;
  let updates;
  try {
    updates = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  try {
    const document = await prisma.propertyDocument.update({
      where: { id: docId },
      data: updates,
    });
    return NextResponse.json(document);
  } catch {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { docId } = await params;
  try {
    await prisma.propertyDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
}
