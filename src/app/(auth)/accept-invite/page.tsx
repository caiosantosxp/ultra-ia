import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/get-t';
import { acceptInviteViaOAuth } from '@/actions/admin-invite-actions';
import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const t = await getT();
  const { token, error: errorParam } = await searchParams;

  if (!token) redirect('/login');

  const inviteToken = await prisma.expertInviteToken.findUnique({
    where: { token },
    include: { specialist: { select: { name: true } } },
  });

  // Token inválido, expirado ou já utilizado
  if (!inviteToken || inviteToken.usedAt || inviteToken.expiresAt < new Date()) {
    return (
      <div className="w-full max-w-sm px-4">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold">{t.acceptInvite.title}</h1>
          <p className="mt-3 text-sm text-destructive">{t.acceptInvite.errorExpired}</p>
        </div>
      </div>
    );
  }

  // Usuário já logado com o e-mail correspondente — auto-aceitar
  const session = await auth();
  if (session?.user?.email?.toLowerCase() === inviteToken.email.toLowerCase() && session.user.id) {
    const result = await acceptInviteViaOAuth(token, session.user.id)
    if (result.success) redirect('/expert/dashboard');

    const errorMsg =
      result.error?.code === 'CONFLICT'
        ? t.acceptInvite.errorConflict
        : result.error?.code === 'FORBIDDEN'
          ? t.acceptInvite.errorMismatch
          : t.acceptInvite.errorExpired

    return (
      <div className="w-full max-w-sm px-4">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold">{t.acceptInvite.title}</h1>
          <p className="mt-3 text-sm text-destructive">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // Usuário logado com e-mail diferente — exibir erro de mismatch
  if (session?.user && session.user.email?.toLowerCase() !== inviteToken.email.toLowerCase()) {
    return (
      <div className="w-full max-w-sm px-4">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold">{t.acceptInvite.title}</h1>
          <p className="mt-3 text-sm text-destructive">{t.acceptInvite.errorMismatch}</p>
        </div>
      </div>
    );
  }

  const errorMessage =
    errorParam === 'CONFLICT'
      ? t.acceptInvite.errorConflict
      : errorParam === 'FORBIDDEN'
        ? t.acceptInvite.errorMismatch
        : errorParam
          ? t.acceptInvite.errorExpired
          : undefined

  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.acceptInvite.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.acceptInvite.subtitleNew.replace('{specialistName}', inviteToken.specialist.name)}
        </p>
      </div>
      {errorMessage && (
        <p className="mb-4 text-center text-sm text-destructive">{errorMessage}</p>
      )}
      <AcceptInviteForm
        token={token}
        targetEmail={inviteToken.email}
      />
    </div>
  );
}
