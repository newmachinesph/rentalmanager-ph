import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const documents = await prisma.propertyDocument.findMany({ where: { propertyId: id } });
  return NextResponse.json(documents);
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
  const document = await prisma.propertyDocument.create({
    data: {
      propertyId: id,
      name: body.name || '',
      url: body.url || '',
      description: body.description || '',
      dateUploaded: new Date().toISOString().split('T')[0],
    },
  });
  return NextResponse.json(document, { status: 201 });
}
