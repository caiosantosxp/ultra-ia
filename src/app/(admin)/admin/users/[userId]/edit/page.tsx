import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserEditForm } from '@/components/admin/user-edit-form';
import { buttonVariants } from '@/components/ui/button';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return {
    title: `Edit ${user?.name ?? user?.email ?? 'User'} — Admin | ultra-ia`,
  };
}

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/chat');

  const t = await getT();
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      deletedAt: true,
      accounts: { select: { id: true }, take: 1 },
      ownedSpecialist: { select: { id: true, isActive: true } },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href={`/admin/users/${userId}`}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.admin.userEditPage.backLabel}
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">{t.admin.userEditPage.pageTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user.name ?? user.email ?? user.id}
        </p>
      </div>

      <UserEditForm
        userId={user.id}
        initialName={user.name}
        initialEmail={user.email}
        initialRole={user.role as 'USER' | 'EXPERT' | 'ADMIN'}
        hasOAuthAccount={user.accounts.length > 0}
        hasOwnedSpecialist={!!user.ownedSpecialist}
        isSelf={session.user.id === user.id}
      />
    </div>
  );
}
