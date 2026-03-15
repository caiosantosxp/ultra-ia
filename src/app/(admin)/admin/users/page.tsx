import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UsersTable } from '@/components/admin/users-table';
import { getT } from '@/lib/i18n/get-t';

export const metadata: Metadata = {
  title: 'Users — Admin | ultra-ia',
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/chat');
  }

  const t = await getT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t.admin.usersPage.title}</h1>
        <p className="text-muted-foreground">
          {t.admin.usersPage.subtitle}
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
