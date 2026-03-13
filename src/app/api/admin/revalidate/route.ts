import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Acesso negado' }, { status: 403 });
  }

  revalidateTag('analytics', 'default');
  return Response.json({ success: true, revalidated: true });
}
