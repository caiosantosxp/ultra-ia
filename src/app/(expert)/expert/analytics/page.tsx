'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';
import { BarChart2, Calendar, MessageSquare, Mic, ThumbsUp, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { LeadConversationsPanel } from '@/components/expert/lead-conversations-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

type Period = 7 | 15 | 30;

interface CountryStat { country: string; count: number; percentage: number }
interface HourlyStat  { hour: number; count: number }

interface AgentMetrics {
  totalMessages: number;
  activeSubscribers: number;
  retentionRate: number;
  messagesPerDay: string;
  conversationsPerWeek: string;
  dailyData: Array<{ date: string; count: number }>;
  countryData: CountryStat[];
  hourlyData: HourlyStat[];
}

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error('err'); return r.json(); });

const COUNTRY_LABELS: Record<string, string> = {
  FR: '🇫🇷 France',
  BE: '🇧🇪 Belgique',
  CA: '🇨🇦 Canada',
  CH: '🇨🇭 Suisse',
  LU: '🇱🇺 Luxembourg',
  MA: '🇲🇦 Maroc',
  US: '🇺🇸 États-Unis',
  Autre: '🌍 Autre',
};

const countryChartConfig: ChartConfig = {
  count: { label: 'Sessions', color: 'hsl(var(--primary))' },
};

const hourlyChartConfig: ChartConfig = {
  count: { label: 'Messages', color: 'hsl(var(--primary))' },
};

const HOUR_COLORS = (h: number) => {
  if (h >= 8 && h < 12)  return 'hsl(var(--primary))';
  if (h >= 12 && h < 14) return 'hsl(220 70% 60%)';
  if (h >= 14 && h < 18) return 'hsl(var(--primary))';
  if (h >= 18 && h < 22) return 'hsl(280 60% 55%)';
  return 'hsl(var(--muted-foreground))';
};

export default function ExpertAnalyticsPage() {
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(30);

  useEffect(() => {
    fetch('/api/expert/specialist-id')
      .then((r) => r.json())
      .then((d) => { if (d.specialistId) setSpecialistId(d.specialistId); })
      .catch(() => {});
  }, []);

  const { data, isLoading, error } = useSWR<{ success: boolean; data: AgentMetrics }>(
    specialistId ? `/api/admin/analytics?specialistId=${specialistId}&period=${period}` : null,
    fetcher,
    { refreshInterval: 300_000 }
  );

  const metrics = data?.data;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="metricas">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
          <TabsTrigger value="chamadas">Chamadas</TabsTrigger>
          <TabsTrigger value="opiniao">Opinião</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="mt-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
            {([7, 15, 30] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {p} dias
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">Erro ao carregar métricas.</p>}

          <Tabs defaultValue="atividade-detalhada">
            <TabsList>
              <TabsTrigger value="atividade-detalhada">Atividade detalhada</TabsTrigger>
              <TabsTrigger value="sessao-por-pais">Sessão por país</TabsTrigger>
              <TabsTrigger value="atividade-por-hora">Atividade por hora</TabsTrigger>
            </TabsList>

            {/* ── Atividade detalhada ─────────────────────────────────────── */}
            <TabsContent value="atividade-detalhada" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <MetricsCard icon={MessageSquare} label="Total mensagens" value={metrics?.totalMessages ?? 0} description={`Últimos ${period} dias`} isLoading={isLoading} />
                <MetricsCard icon={BarChart2}     label="Msgs/dia"         value={metrics ? `${metrics.messagesPerDay}/dia` : '—'} isLoading={isLoading} />
                <MetricsCard icon={Users}         label="Assinantes ativos" value={metrics?.activeSubscribers ?? 0} isLoading={isLoading} />
                <MetricsCard icon={TrendingUp}    label="Retenção"          value={metrics ? `${metrics.retentionRate}%` : '—'} isLoading={isLoading} />
                <MetricsCard icon={Calendar}      label="Conversas/sem"     value={metrics ? `${metrics.conversationsPerWeek}/sem` : '—'} isLoading={isLoading} />
              </div>
              <AnalyticsChart data={metrics?.dailyData ?? []} isLoading={isLoading} />
            </TabsContent>

            {/* ── Sessão por país ─────────────────────────────────────────── */}
            <TabsContent value="sessao-por-pais" className="mt-4 space-y-4">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
              ) : !metrics?.countryData?.length ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Nenhum dado para este período</p>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Bar chart */}
                  <ChartContainer config={countryChartConfig} className="h-64 w-full">
                    <BarChart data={metrics.countryData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} className="text-xs text-muted-foreground" />
                      <YAxis
                        type="category"
                        dataKey="country"
                        width={80}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => COUNTRY_LABELS[v] ?? v}
                        className="text-xs text-muted-foreground"
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent formatter={(v, _n, p) => [`${v} sessions (${(p.payload as CountryStat).percentage}%)`, COUNTRY_LABELS[(p.payload as CountryStat).country] ?? (p.payload as CountryStat).country]} />}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ChartContainer>

                  {/* Table */}
                  <div className="space-y-2">
                    {metrics.countryData.map((row) => (
                      <div key={row.country} className="flex items-center gap-3">
                        <span className="w-28 text-sm">{COUNTRY_LABELS[row.country] ?? row.country}</span>
                        <div className="flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-xs text-muted-foreground">
                          {row.count} sess. ({row.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Atividade por hora ──────────────────────────────────────── */}
            <TabsContent value="atividade-por-hora" className="mt-4 space-y-4">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
              ) : !metrics?.hourlyData?.some((h) => h.count > 0) ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Nenhum dado para este período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Distribuição de mensagens por hora do dia (UTC)</p>
                  <ChartContainer config={hourlyChartConfig} className="h-64 w-full">
                    <BarChart data={metrics.hourlyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(h: number) => `${String(h).padStart(2, '0')}h`}
                        className="text-xs text-muted-foreground"
                        interval={1}
                      />
                      <YAxis tick={{ fontSize: 11 }} className="text-xs text-muted-foreground" />
                      <ChartTooltip
                        content={<ChartTooltipContent formatter={(v, _n, p) => [`${v} mensagens`, `${String((p.payload as HourlyStat).hour).padStart(2, '0')}:00 – ${String((p.payload as HourlyStat).hour + 1).padStart(2, '0')}:00`]} />}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {metrics.hourlyData.map((entry) => (
                          <Cell key={entry.hour} fill={HOUR_COLORS(entry.hour)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary" />Manhã (8h–12h)</span>
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: 'hsl(220 70% 60%)' }} />Almoço (12h–14h)</span>
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary" />Tarde (14h–18h)</span>
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: 'hsl(280 60% 55%)' }} />Noite (18h–22h)</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="conversas" className="mt-6">
          <LeadConversationsPanel />
        </TabsContent>
        <TabsContent value="chamadas" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground"><Mic className="h-8 w-8" /><p className="text-sm">Historique des appels disponible prochainement</p></div>
          </div>
        </TabsContent>
        <TabsContent value="opiniao" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground"><ThumbsUp className="h-8 w-8" /><p className="text-sm">Avis et opinions disponibles prochainement</p></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
