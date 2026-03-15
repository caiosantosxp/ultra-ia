import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Bot, Mail, Calendar, MessageSquare, MessagesSquare, Pencil } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserDetailCard } from '@/components/admin/user-detail-card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    title: `${user?.name ?? user?.email ?? 'User'} — Admin | ultra-ia`,
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

  const t = await getT();
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
      deletedAt: true,
      ownedSpecialist: {
        select: { id: true, name: true, domain: true, accentColor: true, isActive: true },
      },
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
          {t.admin.userDetailPage.backLabel}
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.admin.userDetailPage.profileTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">{user.name ?? '—'}</h2>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {t.admin.userDetailPage.memberSince} {new Date(user.createdAt).toLocaleDateString(t.dateLocale)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.deletedAt && (
                <Badge variant="outline" className="text-muted-foreground">{t.admin.userDetailPage.inactiveBadge}</Badge>
              )}
              <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'EXPERT' ? 'secondary' : 'outline'}>
                {user.role}
              </Badge>
              <Link
                href={`/admin/users/${user.id}/edit`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                {t.admin.userDetailPage.editButton}
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user._count.messages}</span>
              <span className="text-muted-foreground">{t.admin.userDetailPage.messages}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessagesSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user._count.conversations}</span>
              <span className="text-muted-foreground">{t.admin.userDetailPage.conversations}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked specialist (EXPERT users) */}
      {user.role === 'EXPERT' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.admin.userDetailPage.linkedSpecialist}</CardTitle>
          </CardHeader>
          <CardContent>
            {user.ownedSpecialist ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: user.ownedSpecialist.accentColor }}
                  >
                    {user.ownedSpecialist.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.ownedSpecialist.name}</p>
                    <p className="text-xs text-muted-foreground">{user.ownedSpecialist.domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.ownedSpecialist.isActive ? 'default' : 'secondary'}>
                    {user.ownedSpecialist.isActive ? t.admin.userDetailPage.activeStatus : t.admin.userDetailPage.inactiveStatus}
                  </Badge>
                  <Link
                    href={`/admin/agents/${user.ownedSpecialist.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <Bot className="mr-1.5 h-3.5 w-3.5" />
                    {t.admin.userDetailPage.viewAgent}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t.admin.userDetailPage.noLinkedSpecialist}
              </p>
            )}
          </CardContent>
        </Card>
      )}

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
