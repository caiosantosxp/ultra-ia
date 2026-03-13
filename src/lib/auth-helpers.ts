import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

type AdminError = { code: string; message: string };
type AdminUser = { id: string; role: string; email?: string | null };

export type AdminAuthResult =
  | { user: AdminUser; error?: never }
  | { user?: never; error: AdminError };

export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: { code: 'AUTH_REQUIRED', message: 'Authentification requise' } };
  }
  if (session.user.role !== 'ADMIN') {
    return { error: { code: 'FORBIDDEN', message: 'Accès administrateur requis' } };
  }
  return {
    user: {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
    },
  };
}

export function adminErrorResponse(error: AdminError) {
  const status = error.code === 'AUTH_REQUIRED' ? 401 : 403;
  return NextResponse.json({ success: false, error }, { status });
}
