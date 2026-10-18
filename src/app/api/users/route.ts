import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';

const VALID_ROLES = ['admin', 'manager', 'viewer'];

export async function GET() {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  // Only admins can create users
  const result = await requireRole('admin');
  if (result instanceof NextResponse) return result;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }

  // Validate role is an allowed value
  const assignedRole = VALID_ROLES.includes(role) ? role : 'viewer';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: assignedRole },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
