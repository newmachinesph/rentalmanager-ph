import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, getSession } from '@/lib/apiAuth';

export async function GET() {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  const user = await prisma.user.findUnique({
    where: { id: result.session.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { name, email } = body;

  const updated = await prisma.user.update({
    where: { id: result.session.id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Update the iron-session with new user data
  const session = await getSession();
  session.name = updated.name;
  session.email = updated.email;
  await session.save();

  return NextResponse.json(updated);
}
