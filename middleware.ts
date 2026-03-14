import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

const publicRoutes = ['/', '/login', '/register', '/pricing', '/privacy', '/terms', '/forgot-password', '/reset-password'];
const publicPrefixes = ['/specialist/', '/api/auth/', '/auth/'];
const adminRoutes = ['/admin'];
const expertRoutes = ['/expert'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const role = req.auth?.user?.role;

  const isPublic =
    publicRoutes.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      let dest = '/chat';
      if (role === 'ADMIN') dest = '/admin/dashboard';
      else if (role === 'EXPERT') dest = '/expert/dashboard';
      return NextResponse.redirect(new URL(dest, req.url));
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
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }

  if (expertRoutes.some((route) => pathname.startsWith(route))) {
    if (role !== 'EXPERT' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }

  if (pathname === '/chat' && role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  if (pathname === '/chat' && role === 'EXPERT') {
    return NextResponse.redirect(new URL('/expert/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
