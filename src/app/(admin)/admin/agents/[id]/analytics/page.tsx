'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { BarChart2, Calendar, MessageCircle, MessageSquare, Mic, ThumbsUp, TrendingUp, Users } from 'lucide-react';

import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/lib/i18n/use-t';

type Period = 7 | 30 | 90;

interface AgentMetrics {
  totalMessages: number;
  activeSubscribers: number;
  retentionRate: number;
  messagesPerDay: string;
  conversationsPerWeek: string;
  dailyData: Array<{ date: string; count: number }>;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export default function ExpertAnalyticsPage() {
  const ap = useT().admin.analyticsPage;
  const params = useParams();
  const specialistId = params.id as string;
  const [period, setPeriod] = useState<Period>(30);

  const { data, isLoading, error } = useSWR<{ success: boolean; data: AgentMetrics }>(
    `/api/admin/analytics?specialistId=${specialistId}&period=${period}`,
    fetcher,
    { refreshInterval: 300_000 }
  );

  const metrics = data?.data;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="metricas">
        <TabsList>
          <TabsTrigger value="metricas">{ap.tabMetrics}</TabsTrigger>
          <TabsTrigger value="conversas">{ap.tabConversations}</TabsTrigger>
          <TabsTrigger value="chamadas">{ap.tabCalls}</TabsTrigger>
          <TabsTrigger value="opiniao">{ap.tabOpinions}</TabsTrigger>
        </TabsList>

        {/* ── Metrics ── */}
        <TabsContent value="metricas" className="mt-6 space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{ap.periodLabel}</span>
            {([7, 30, 90] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {ap.periodDaysShort.replace('{period}', String(p))}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive">{ap.fetchError}</p>
          )}

          {/* Sub-tabs */}
          <Tabs defaultValue="atividade-detalhada">
            <TabsList>
              <TabsTrigger value="atividade-detalhada">{ap.tabActivityDetail}</TabsTrigger>
              <TabsTrigger value="sessao-por-pais">{ap.tabSessionByCountry}</TabsTrigger>
              <TabsTrigger value="atividade-por-hora">{ap.tabActivityByHour}</TabsTrigger>
            </TabsList>

            <TabsContent value="atividade-detalhada" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <MetricsCard
                  icon={MessageSquare}
                  label={ap.cardTotalMessages}
                  value={metrics?.totalMessages ?? 0}
                  description={ap.periodDays.replace('{period}', String(period))}
                  isLoading={isLoading}
                />
                <MetricsCard
                  icon={BarChart2}
                  label={ap.cardMsgsPerDay}
                  value={metrics ? `${metrics.messagesPerDay}` : '—'}
                  isLoading={isLoading}
                />
                <MetricsCard
                  icon={Users}
                  label={ap.cardSubscribers}
                  value={metrics?.activeSubscribers ?? 0}
                  isLoading={isLoading}
                />
                <MetricsCard
                  icon={TrendingUp}
                  label={ap.cardRetention}
                  value={metrics ? `${metrics.retentionRate}%` : '—'}
                  isLoading={isLoading}
                />
                <MetricsCard
                  icon={Calendar}
                  label={ap.cardConvsPerWeek}
                  value={metrics ? `${metrics.conversationsPerWeek}` : '—'}
                  isLoading={isLoading}
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {ap.dailyChartDesc.replace('{period}', String(period))}
                </h3>
                <AnalyticsChart data={metrics?.dailyData ?? []} isLoading={isLoading} />
              </div>
            </TabsContent>

            <TabsContent value="sessao-por-pais" className="mt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  {ap.geoComingSoon}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="atividade-por-hora" className="mt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  {ap.hourlyComingSoon}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Conversations ── */}
        <TabsContent value="conversas" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-8 w-8" />
              <p className="text-sm">{ap.conversationsComingSoon}</p>
            </div>
          </div>
        </TabsContent>

        {/* ── Calls ── */}
        <TabsContent value="chamadas" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Mic className="h-8 w-8" />
              <p className="text-sm">{ap.callsComingSoon}</p>
            </div>
          </div>
        </TabsContent>

        {/* ── Opinions ── */}
        <TabsContent value="opiniao" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ThumbsUp className="h-8 w-8" />
              <p className="text-sm">{ap.opinionsComingSoon}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
