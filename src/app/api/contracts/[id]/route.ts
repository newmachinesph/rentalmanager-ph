import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

const INCLUDE_LEASE = {
  lease: {
    include: {
      property: { select: { id: true, name: true, address: true, city: true, province: true, barangay: true } },
      unit: { select: { id: true, name: true } },
      tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  },
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    const contract = await prisma.contract.findUnique({ where: { id }, include: INCLUDE_LEASE });
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.signedDate !== undefined) data.signedDate = body.signedDate;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.content !== undefined) data.content = body.content;

    const updated = await prisma.contract.update({
      where: { id },
      data,
      include: INCLUDE_LEASE,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  try {
    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
