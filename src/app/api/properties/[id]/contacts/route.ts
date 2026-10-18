import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const contacts = await prisma.propertyContact.findMany({ where: { propertyId: id } });
  return NextResponse.json(contacts);
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
  const contact = await prisma.propertyContact.create({
    data: {
      propertyId: id,
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
