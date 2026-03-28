import { Users2 } from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { requireExpert } from '@/lib/expert-helpers';
import { getT } from '@/lib/i18n/get-t';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SubscribersFilters } from '@/components/expert/subscribers-filters';

type StatusFilter = 'all' | 'active' | 'new';
type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom';

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

export default async function ExpertSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; period?: string; from?: string; to?: string }>;
}) {
  const { specialist } = await requireExpert();
  const t = await getT();
  const params = await searchParams;

  const statusFilter = (params.status ?? 'all') as StatusFilter;
  const periodFilter = (params.period ?? 'all') as PeriodFilter;

  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;

  if (periodFilter === 'custom' && params.from) {
    periodStart = new Date(params.from);
    periodEnd = params.to ? new Date(params.to + 'T23:59:59') : null;
  } else {
    periodStart = getPeriodDate(periodFilter);
    periodEnd = getPeriodEndDate(periodFilter);
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Build where for conversations
  const dateWhere = periodStart
    ? { createdAt: { gte: periodStart, ...(periodEnd ? { lt: periodEnd } : {}) } }
    : {};

  const activeWhere = statusFilter === 'active' ? { updatedAt: { gte: sevenDaysAgo } } : {};

  const conversationGroups = await prisma.conversation.groupBy({
    by: ['userId'],
    where: {
      specialistId: specialist.id,
      userId: { not: null },
      isDeleted: false,
      ...dateWhere,
      ...activeWhere,
    },
    _count: { id: true },
    _min: { createdAt: true },
    _max: { updatedAt: true },
    orderBy: { _max: { updatedAt: 'desc' } },
    ...(statusFilter === 'new'
      ? { having: { createdAt: { _min: { gte: thirtyDaysAgo } } } }
      : {}),
  });

  const userIds = conversationGroups
    .map((g) => g.userId)
    .filter((id): id is string => id !== null);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const rows = conversationGroups.map((g) => ({
    userId: g.userId as string,
    conversationCount: g._count.id,
    firstSeen: g._min.createdAt as Date,
    lastSeen: g._max.updatedAt as Date,
    user: userMap.get(g.userId as string),
  }));

  const activeCount = rows.filter((r) => r.lastSeen >= thirtyDaysAgo).length;

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
          {' '}/ {rows.length} {t.admin.subscribersPage.total}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.admin.subscribersPage.listTitle}</CardTitle>
          <SubscribersFilters />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.admin.subscribersPage.colName}</TableHead>
                <TableHead>{t.admin.subscribersPage.colEmail}</TableHead>
                <TableHead>{t.admin.subscribersPage.colConversations}</TableHead>
                <TableHead>{t.admin.subscribersPage.colSince}</TableHead>
                <TableHead>{t.admin.subscribersPage.colPeriodEnd}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {t.admin.subscribersPage.noSubscribers}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell className="font-medium">{row.user?.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.user?.email ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.conversationCount}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.firstSeen.toLocaleDateString(t.dateLocale)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.lastSeen.toLocaleDateString(t.dateLocale)}
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
