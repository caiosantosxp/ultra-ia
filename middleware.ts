import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

const publicRoutes = ['/', '/login', '/register', '/pricing', '/privacy', '/terms', '/forgot-password', '/reset-password'];
const publicPrefixes = ['/specialist/', '/api/auth/', '/auth/'];
const adminRoutes = ['/admin'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const isPublic =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (req.auth?.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
