import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Prevent timing-based user enumeration
  if (!user) {
    await bcrypt.compare(password, '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012');
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const session = await getSession();
  session.id = user.id;
  session.name = user.name;
  session.email = user.email;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
