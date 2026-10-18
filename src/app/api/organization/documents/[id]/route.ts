import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const doc = await prisma.orgDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
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
  const doc = await prisma.orgDocument.update({ where: { id }, data: updates });
  return NextResponse.json(doc);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  await prisma.orgDocument.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
