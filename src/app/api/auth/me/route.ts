import { NextResponse } from 'next/server';
import { getSession } from '@/lib/apiAuth';

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: { id: session.id, name: session.name, email: session.email, role: session.role } });
}
