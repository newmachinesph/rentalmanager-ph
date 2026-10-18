import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;
  const units = await prisma.unit.findMany({ where: { propertyId: id } });
  return NextResponse.json(units);
}

const VALID_UNIT_STATUSES = ['Vacant', 'Occupied', 'Under Maintenance', 'Reserved'] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireRole('admin', 'manager');
  if (authError instanceof NextResponse) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required and must be a non-empty string' }, { status: 400 });
  }

  // Validate monthlyRent if provided
  if (body.monthlyRent !== undefined) {
    if (typeof body.monthlyRent !== 'number' || body.monthlyRent < 0) {
      return NextResponse.json({ error: 'monthlyRent must be a non-negative number' }, { status: 400 });
    }
  }

  // Validate status if provided
  if (body.status !== undefined) {
    if (!VALID_UNIT_STATUSES.includes(body.status as typeof VALID_UNIT_STATUSES[number])) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_UNIT_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
  }

  // Field allowlist — only pick known safe fields
  const data = {
    propertyId: id,
    name: (body.name as string).trim(),
    ...(body.floor !== undefined && { floor: body.floor as string }),
    ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms as number }),
    ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms as number }),
    ...(body.areaSqm !== undefined && { areaSqm: body.areaSqm as number }),
    ...(body.monthlyRent !== undefined && { monthlyRent: body.monthlyRent as number }),
    ...(body.status !== undefined && { status: body.status as string }),
  };

  const unit = await prisma.unit.create({ data });
  return NextResponse.json(unit, { status: 201 });
}
