import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  const result = await requireRole('admin', 'manager');
  if (result instanceof NextResponse) return result;

  // Mock: return a placeholder avatar URL
  return NextResponse.json({ avatarUrl: '/avatars/default.png' }, { status: 201 });
}
