import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hiremind_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/auth') || pathname === '/welcome' || pathname === '/';
  const isDashboardPage = pathname.startsWith('/dashboard');

  if (token) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
    if (isDashboardPage) {
      return NextResponse.redirect(new URL('/welcome', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
