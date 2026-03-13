import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, MessageSquare, MessagesSquare } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserDetailCard } from '@/components/admin/user-detail-card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    title: `${user?.name ?? user?.email ?? 'Usuário'} — Admin | ultra-ia`,
  };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/chat');
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      subscriptions: {
        include: {
          specialist: {
            select: { name: true, domain: true, accentColor: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          messages: true,
          conversations: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/admin/users" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Usuários
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">{user.name ?? '(sem nome)'}</h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user._count.messages}</span>
              <span className="text-muted-foreground">mensagens</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessagesSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user._count.conversations}</span>
              <span className="text-muted-foreground">conversas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions + Admin Actions */}
      <UserDetailCard
        userId={user.id}
        subscriptions={user.subscriptions.map((sub) => ({
          id: sub.id,
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          specialist: sub.specialist,
        }))}
      />
    </div>
  );
}
