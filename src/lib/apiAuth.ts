import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SessionData, sessionOptions } from './auth';

/**
 * Get the current iron-session from the cookie store.
 * Must be called from a Server Component or Route Handler (not Edge middleware).
 */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Require an authenticated session.
 * Returns `{ session }` on success, or a 401 NextResponse on failure.
 */
export async function requireAuth(): Promise<{ session: SessionData } | NextResponse> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { session };
}

/**
 * Require an authenticated session with one of the allowed roles.
 * Returns `{ session }` on success, 401 if unauthenticated, or 403 if role mismatch.
 */
export async function requireRole(...allowedRoles: string[]): Promise<{ session: SessionData } | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;
  if (!allowedRoles.includes(result.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}

/**
 * Higher-order function wrapping route handlers with auth.
 * Provides the authenticated session to the handler.
 */
export function withAuth(
  handler: (request: Request, session: SessionData) => Promise<NextResponse>,
) {
  return async (request: Request) => {
    const result = await requireAuth();
    if (result instanceof NextResponse) return result;
    return handler(request, result.session);
  };
}
