import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UsersTable } from '@/components/admin/users-table';

export const metadata: Metadata = {
  title: 'Gestão de Usuários — Admin | ultra-ia',
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/chat');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie os usuários e assinaturas da plataforma.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
