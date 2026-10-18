import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError instanceof NextResponse) return authError;

  // Rent change history requires historical data not yet tracked
  return NextResponse.json({ entries: [] });
}
