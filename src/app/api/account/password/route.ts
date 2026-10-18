import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  let parsed;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: result.session.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: result.session.id },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}
