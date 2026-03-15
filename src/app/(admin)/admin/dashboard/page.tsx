'use client';

import useSWR from 'swr';
import { BarChart, Bot, RefreshCw, TrendingUp, Users, MessageSquare, UserCheck } from 'lucide-react';

import { MetricsCard } from '@/components/dashboard/metrics-card';
import { MetricsCardSkeleton } from '@/components/dashboard/metrics-card-skeleton';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/use-t';
import type { PlatformMetrics } from '@/types/admin';

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Falha ao buscar métricas');
    return res.json();
  });

function formatMRR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function AdminDashboardPage() {
  const t = useT();
  const {
    data,
    isLoading,
    error,
    mutate,
  } = useSWR<{ success: boolean; data: PlatformMetrics }>(
    '/api/admin/analytics?type=platform',
    fetcher,
    { refreshInterval: 300_000 }
  );

  const metrics = data?.data;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground">{t.admin.dashboard.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
          aria-label={t.admin.dashboard.refreshAria}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t.admin.dashboard.refresh}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {t.admin.dashboard.fetchError}{' '}
            <button
              onClick={() => mutate()}
              className="underline hover:no-underline"
            >
              {t.admin.dashboard.retry}
            </button>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          <>
            <MetricsCardSkeleton />
            <MetricsCardSkeleton />
            <MetricsCardSkeleton />
            <MetricsCardSkeleton />
            <MetricsCardSkeleton />
            <MetricsCardSkeleton />
            <MetricsCardSkeleton />
          </>
        ) : (
          <>
            <MetricsCard
              icon={Users}
              label={t.admin.dashboard.activeSubscribers}
              value={metrics?.activeSubscribers ?? 0}
              trend={metrics?.activeSubscribersTrend}
            />
            <MetricsCard
              icon={MessageSquare}
              label={t.admin.dashboard.messagesToday}
              value={metrics?.messagesToday ?? 0}
              trend={metrics?.messagesTodayTrend}
            />
            <MetricsCard
              icon={BarChart}
              label={t.admin.dashboard.mrr}
              value={metrics ? formatMRR(metrics.mrr) : '—'}
              trend={metrics?.mrrTrend}
            />
            <MetricsCard
              icon={TrendingUp}
              label={t.admin.dashboard.retentionRate}
              value={metrics ? `${metrics.retentionRate}%` : '—'}
              trend={metrics?.retentionRateTrend}
            />
            <MetricsCard
              icon={Users}
              label={t.admin.dashboard.totalUsers}
              value={metrics?.totalUsers ?? 0}
            />
            <MetricsCard
              icon={UserCheck}
              label={t.admin.dashboard.activeExperts}
              value={metrics?.totalExperts ?? 0}
            />
            <MetricsCard
              icon={Bot}
              label={t.admin.dashboard.activeAgents}
              value={metrics?.totalAgents ?? 0}
            />
          </>
        )}
      </div>
    </div>
  );
}
