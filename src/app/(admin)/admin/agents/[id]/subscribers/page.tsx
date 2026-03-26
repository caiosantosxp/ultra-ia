import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users2 } from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CancelSubscriptionButton } from '@/components/admin/cancel-subscription-button';
import { SubscribersFilters } from '@/components/expert/subscribers-filters';
import { getT } from '@/lib/i18n/get-t';

type StatusFilter = 'all' | 'active' | 'new' | 'past_due' | 'canceled' | 'expired' | 'pending';
type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';

function getPeriodDate(period: PeriodFilter): Date | null {
  const now = new Date();
  switch (period) {
    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'last_month':
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case 'last_3_months':
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    case 'last_6_months':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    case 'this_year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

function getPeriodEndDate(period: PeriodFilter): Date | null {
  const now = new Date();
  if (period === 'last_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: `Subscribers — ${specialist?.name ?? 'Agent'} | Admin ultra-ia`,
  };
}

export default async function SubscribersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/chat');

  const t = await getT();
  const { id } = await params;
  const sp = await searchParams;

  const statusFilter = (sp.status ?? 'all') as StatusFilter;
  const periodFilter = (sp.period ?? 'all') as PeriodFilter;

  const periodStart = getPeriodDate(periodFilter);
  const periodEnd = getPeriodEndDate(periodFilter);

  const isNewFilter = statusFilter === 'new';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const statusMap: Record<string, string> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    expired: 'EXPIRED',
    pending: 'PENDING',
  };

  const [specialist, subscriptions] = await Promise.all([
    prisma.specialist.findUnique({
      where: { id },
      select: { id: true, name: true, accentColor: true },
    }),
    prisma.subscription.findMany({
      where: {
        specialistId: id,
        ...(statusFilter !== 'all' && !isNewFilter
          ? { status: statusMap[statusFilter] }
          : {}),
        ...(isNewFilter ? { createdAt: { gte: thirtyDaysAgo } } : {}),
        ...(periodStart
          ? {
              createdAt: {
                gte: periodStart,
                ...(periodEnd ? { lt: periodEnd } : {}),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!specialist) redirect('/admin/agents');

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-heading text-2xl font-bold">{t.admin.subscribersPage.title}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {specialist.name} —{' '}
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            {activeCount} {t.admin.subscribersPage.activeCount}
          </Badge>
          {' '}/ {subscriptions.length} {t.admin.subscribersPage.total}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.admin.subscribersPage.listTitle}</CardTitle>
          <SubscribersFilters />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.subscribersPage.colName}</TableHead>
                <TableHead>{t.admin.subscribersPage.colEmail}</TableHead>
                <TableHead>{t.admin.subscribersPage.colStatus}</TableHead>
                <TableHead>{t.admin.subscribersPage.colSince}</TableHead>
                <TableHead>{t.admin.subscribersPage.colPeriodEnd}</TableHead>
                <TableHead className="w-40">{t.admin.subscribersPage.colActions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t.admin.subscribersPage.noSubscribers}
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.user?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {sub.user?.email ?? '—'}
                    </TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={sub.status} t={t} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(sub.createdAt).toLocaleDateString(t.dateLocale)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString(t.dateLocale)
                        : '—'}
                      {sub.cancelAtPeriodEnd && (
                        <span className="ml-1 text-orange-600 text-xs">{t.admin.subscribersPage.scheduledCancellation}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {sub.user && (
                          <Link
                            href={`/admin/users/${sub.user.id}`}
                            className={buttonVariants({ variant: 'outline', size: 'sm' })}
                          >
                            {t.admin.subscribersPage.viewUser}
                          </Link>
                        )}
                        {sub.status === 'ACTIVE' && sub.user && (
                          <CancelSubscriptionButton
                            userId={sub.user.id}
                            subscriptionId={sub.id}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionStatusBadge({ status, t }: { status: string; t: Awaited<ReturnType<typeof getT>> }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t.admin.subscribersPage.statusActive}</Badge>;
    case 'PAST_DUE':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{t.admin.subscribersPage.statusPastDue}</Badge>;
    case 'CANCELED':
      return <Badge variant="secondary">{t.admin.subscribersPage.statusCanceled}</Badge>;
    case 'EXPIRED':
      return <Badge variant="secondary">{t.admin.subscribersPage.statusExpired}</Badge>;
    case 'PENDING':
      return <Badge variant="outline">{t.admin.subscribersPage.statusPending}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
