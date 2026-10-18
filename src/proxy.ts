import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Allow login page and API routes (API routes handle their own auth)
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    // If user has a session cookie and tries to visit /login, redirect to dashboard
    if (pathname === '/login' && sessionCookie?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    return NextResponse.next();
  }

  // No session cookie -> redirect to login
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
