import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const documents = await prisma.orgDocument.findMany();
  return NextResponse.json(documents);
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
  const doc = await prisma.orgDocument.create({
    data: {
      name: body.name || '',
      url: body.url || '',
      description: body.description || '',
      dateUploaded: new Date().toISOString().split('T')[0],
    },
  });
  return NextResponse.json(doc, { status: 201 });
}
