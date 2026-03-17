import { DollarSign, TrendingUp, Users } from 'lucide-react';

import { requireExpert } from '@/lib/expert-helpers';
import { getT } from '@/lib/i18n/get-t';
import { prisma } from '@/lib/prisma';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default async function ExpertRendasPage() {
  const { specialist: base } = await requireExpert();
  const t = await getT();

  const [specialist, activeSubscriptions, totalSubscriptions] = await Promise.all([
    prisma.specialist.findUnique({
      where: { id: base.id },
      select: { name: true, price: true },
    }),
    prisma.subscription.count({ where: { specialistId: base.id, status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { specialistId: base.id } }),
  ]);

  if (!specialist) return null;

  const mrr = activeSubscriptions * specialist.price;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">{t.admin.revenuePage.title}</h2>
        <p className="text-sm text-muted-foreground">{t.admin.revenuePage.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              {t.admin.revenuePage.mrr}
            </p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(mrr)}</p>
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
            {formatCurrency(specialist.price)} {t.admin.revenuePage.perMonthEach}
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

      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-card">
        <p className="text-sm text-muted-foreground">
          {t.admin.revenuePage.historyComingSoon}
        </p>
      </div>
    </div>
  );
}
