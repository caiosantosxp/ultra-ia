import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { acceptInviteViaOAuth } from '@/actions/admin-invite-actions';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInviteGoogleCallbackPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { token } = await searchParams;
  if (!token) redirect('/login');

  const result = await acceptInviteViaOAuth(token, session.user.id!);

  if (result.success) redirect('/expert/dashboard');

  redirect(`/accept-invite?token=${token}&error=${result.error?.code ?? 'UNKNOWN'}`);
}
