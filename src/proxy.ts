import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Proteção rotas admin: apenas role ADMIN
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
    }
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', req.url));
    }
  }

  // Proteção rotas dashboard/chat: apenas autenticado
  if (pathname.startsWith('/chat') || pathname.startsWith('/billing') || pathname.startsWith('/checkout')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
});

export const config = {
  matcher: ['/admin/:path*', '/chat/:path*', '/billing/:path*', '/checkout/:path*'],
};
