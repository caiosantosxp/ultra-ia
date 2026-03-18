'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Activity,
  BarChart,
  Bot,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

import { MetricsCard } from '@/components/dashboard/metrics-card';
import { MetricsCardSkeleton } from '@/components/dashboard/metrics-card-skeleton';
import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const PERIOD_VALUES = [7, 30, 90] as const;
type Period = (typeof PERIOD_VALUES)[number];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useT();
  const [period, setPeriod] = useState<Period>(30);

  const { data, isLoading, error, mutate } = useSWR<{ success: boolean; data: PlatformMetrics }>(
    `/api/admin/analytics?type=platform&period=${period}`,
    fetcher,
    { refreshInterval: 300_000 }
  );

  const metrics = data?.data;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.dashboard.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.admin.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
            {PERIOD_VALUES.map((value) => {
              const label = value === 7
                ? t.admin.dashboard.period7d
                : value === 30
                  ? t.admin.dashboard.period30d
                  : t.admin.dashboard.period90d;
              return (
                <Button
                  key={value}
                  variant={period === value ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setPeriod(value)}
                >
                  {label}
                </Button>
              );
            })}
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
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {t.admin.dashboard.fetchError}{' '}
            <button onClick={() => mutate()} className="underline hover:no-underline">
              {t.admin.dashboard.retry}
            </button>
          </p>
        </div>
      )}

      {/* Section: Revenue & Subscribers */}
      <div>
        <SectionLabel>{t.admin.dashboard.sectionRevenue}</SectionLabel>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricsCardSkeleton key={i} />)
          ) : (
            <>
              <MetricsCard
                icon={BarChart}
                label={t.admin.dashboard.mrr}
                value={metrics ? formatMRR(metrics.mrr) : '—'}
                trend={metrics?.mrrTrend}
              />
              <MetricsCard
                icon={Users}
                label={t.admin.dashboard.activeSubscribers}
                value={metrics?.activeSubscribers ?? 0}
                trend={metrics?.activeSubscribersTrend}
              />
              <MetricsCard
                icon={UserPlus}
                label={t.admin.dashboard.newSubscribers}
                value={metrics?.newSubscribersThisPeriod ?? 0}
                trend={metrics?.newSubscribersTrend}
              />
              <MetricsCard
                icon={TrendingUp}
                label={t.admin.dashboard.retentionRate}
                value={metrics ? `${metrics.retentionRate}%` : '—'}
                trend={metrics?.retentionRateTrend}
              />
            </>
          )}
        </div>
      </div>

      {/* Section: Activity */}
      <div>
        <SectionLabel>{t.admin.dashboard.sectionActivity}</SectionLabel>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricsCardSkeleton key={i} />)
          ) : (
            <>
              <MetricsCard
                icon={MessageSquare}
                label={t.admin.dashboard.messagesToday}
                value={metrics?.messagesToday ?? 0}
                trend={metrics?.messagesTodayTrend}
              />
              <MetricsCard
                icon={MessageCircle}
                label={t.admin.dashboard.messagesThisPeriod}
                value={metrics?.totalMessagesThisPeriod ?? 0}
              />
              <MetricsCard
                icon={Activity}
                label={t.admin.dashboard.conversations}
                value={metrics?.totalConversationsThisPeriod ?? 0}
              />
              <MetricsCard
                icon={Users}
                label={t.admin.dashboard.totalUsers}
                value={metrics?.totalUsers ?? 0}
              />
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div>
        <SectionLabel>{t.admin.dashboard.sectionCharts}</SectionLabel>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.admin.dashboard.chartSubscriptions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                data={metrics?.dailySubscriptions ?? []}
                isLoading={isLoading}
                valueLabel={t.admin.dashboard.activeSubscribers.toLowerCase()}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.admin.dashboard.chartMessages}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsChart
                data={metrics?.dailyMessages ?? []}
                isLoading={isLoading}
                valueLabel={t.admin.dashboard.messagesThisPeriod.toLowerCase()}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section: Platform */}
      <div>
        <SectionLabel>{t.admin.dashboard.sectionPlatform}</SectionLabel>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricsCardSkeleton key={i} />)
          ) : (
            <>
              <MetricsCard
                icon={UserPlus}
                label={t.admin.dashboard.newUsers}
                value={metrics?.newUsersThisPeriod ?? 0}
              />
              <MetricsCard
                icon={Activity}
                label={t.admin.dashboard.avgMessages}
                value={metrics?.avgMessagesPerConversation ?? 0}
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
    </div>
  );
}
