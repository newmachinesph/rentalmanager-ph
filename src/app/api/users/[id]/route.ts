import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/apiAuth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only admins can delete users
  const result = await requireRole('admin');
  if (result instanceof NextResponse) return result;

  const { id } = await params;

  // Prevent deleting the last admin
  const adminCount = await prisma.user.count({ where: { role: 'admin' } });
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.role === 'admin' && adminCount <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
