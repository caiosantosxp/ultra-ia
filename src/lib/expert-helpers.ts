import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Verifies the current user is an EXPERT and returns their linked specialist.
 * Redirects to /chat if not authorized or no specialist is linked.
 */
export async function requireExpert() {
  const session = await auth();

  if (!session?.user) redirect('/login');
  if (session.user.role !== 'EXPERT') redirect('/chat');

  const specialist = await prisma.specialist.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!specialist) redirect('/chat');

  return { session, specialist };
}
