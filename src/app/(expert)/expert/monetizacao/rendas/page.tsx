import { cookies } from 'next/headers';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

import { requireExpert } from '@/lib/expert-helpers';
import { getT } from '@/lib/i18n/get-t';
import { prisma } from '@/lib/prisma';
import { RevenueFilters } from '@/components/expert/revenue-filters';

function formatCurrency(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function formatDate(date: Date | null, locale: string) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   'bg-emerald-500/15 text-emerald-400',
  CANCELED: 'bg-red-500/15 text-red-400',
  PAST_DUE: 'bg-amber-500/15 text-amber-400',
  PENDING:  'bg-zinc-500/15 text-zinc-400',
};

function getPeriodRange(period: string): { gte?: Date; lte?: Date } {
  const now = new Date();
  switch (period) {
    case 'this_month': {
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { gte: start, lte: end };
    }
    case 'last_3_months': {
      return { gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()) };
    }
    case 'last_6_months': {
      return { gte: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()) };
    }
    case 'this_year': {
      return { gte: new Date(now.getFullYear(), 0, 1) };
    }
    default:
      return {};
  }
}

type Props = {
  searchParams: Promise<{ period?: string }>;
};

export default async function ExpertRendasPage({ searchParams }: Props) {
  const { specialist: base } = await requireExpert();
  const t = await getT();
  const lang = (await cookies()).get('LANG')?.value ?? 'fr';
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const { period = 'all' } = await searchParams;

  const dateRange = getPeriodRange(period);
  const createdAtFilter = Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {};

  const [specialist, activeSubscriptions, totalSubscriptions, subscriptionHistory] = await Promise.all([
    prisma.specialist.findUnique({
      where: { id: base.id },
      select: { name: true, price: true },
    }),
    prisma.subscription.count({ where: { specialistId: base.id, status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { specialistId: base.id } }),
    prisma.subscription.findMany({
      where: { specialistId: base.id, ...createdAtFilter },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  if (!specialist) return null;

  const mrr = activeSubscriptions * specialist.price;

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE:   t.admin.revenuePage.statusActive,
      CANCELED: t.admin.revenuePage.statusCanceled,
      PAST_DUE: t.admin.revenuePage.statusPastDue,
      PENDING:  t.admin.revenuePage.statusPending,
    };
    return map[status] ?? status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t.admin.revenuePage.title}</h2>
        <p className="text-sm text-muted-foreground">{t.admin.revenuePage.subtitle}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              {t.admin.revenuePage.mrr}
            </p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(mrr, locale)}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.admin.revenuePage.mrrLabel}</p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              {t.admin.revenuePage.active}
            </p>
          </div>
          <p className="text-2xl font-bold">{activeSubscriptions}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(specialist.price, locale)} {t.admin.revenuePage.perMonthEach}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              {t.admin.revenuePage.total}
            </p>
          </div>
          <p className="text-2xl font-bold">{totalSubscriptions}</p>
          <p className="text-xs text-muted-foreground mt-1">{t.admin.revenuePage.totalLabel}</p>
        </div>
      </div>

      {/* Subscription history table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">{t.admin.revenuePage.historyTitle}</h3>
          <RevenueFilters />
        </div>

        {subscriptionHistory.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">{t.admin.revenuePage.noHistory}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.admin.revenuePage.colSubscriber}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.admin.revenuePage.colStatus}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.admin.revenuePage.colSince}
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {t.admin.revenuePage.colAmount}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptionHistory.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium leading-none">{sub.user.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[sub.status] ?? STATUS_STYLES.PENDING}`}>
                        {statusLabel(sub.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(sub.createdAt, locale)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(specialist.price, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
