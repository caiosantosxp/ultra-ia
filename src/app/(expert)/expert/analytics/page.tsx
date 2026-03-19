'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';
import { BarChart2, Calendar, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Cell, XAxis, YAxis, BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { LeadConversationsPanel } from '@/components/expert/lead-conversations-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/lib/i18n/use-t';

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

const HOUR_COLORS = (h: number) => {
  if (h >= 8 && h < 12)  return 'hsl(var(--primary))';
  if (h >= 12 && h < 14) return 'hsl(220 70% 60%)';
  if (h >= 14 && h < 18) return 'hsl(var(--primary))';
  if (h >= 18 && h < 22) return 'hsl(280 60% 55%)';
  return 'hsl(var(--muted-foreground))';
};

function HourlyTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: HourlyStat }> }) {
  const ap = useT().admin.analyticsPage;
  if (!active || !payload?.length) return null;
  const { hour, count } = payload[0].payload;
  if (count === 0) return null;
  const h = String(hour).padStart(2, '0');
  const h1 = String(hour + 1).padStart(2, '0');
  return (
    <div style={{ background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 2 }}>{h}:00 – {h1}:00</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>
        {count}{' '}
        <span style={{ fontSize: 12, fontWeight: 400, color: '#a1a1aa' }}>{ap.hourlyMsgWord}{count !== 1 ? 's' : ''}</span>
      </p>
    </div>
  );
}

export default function ExpertAnalyticsPage() {
  const ap = useT().admin.analyticsPage;
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
          <TabsTrigger value="metricas">{ap.tabMetrics}</TabsTrigger>
          <TabsTrigger value="conversas">{ap.tabConversations}</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="mt-6 space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{ap.periodLabel}</span>
            {([7, 15, 30] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {ap.periodDaysShort.replace('{period}', String(p))}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{ap.fetchError}</p>}

          <Tabs defaultValue="atividade-detalhada">
            <TabsList>
              <TabsTrigger value="atividade-detalhada">{ap.tabActivityDetail}</TabsTrigger>
              <TabsTrigger value="sessao-por-pais">{ap.tabSessionByCountry}</TabsTrigger>
              <TabsTrigger value="atividade-por-hora">{ap.tabActivityByHour}</TabsTrigger>
            </TabsList>

            {/* ── Detailed activity ─────────────────────────────────────── */}
            <TabsContent value="atividade-detalhada" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <MetricsCard icon={MessageSquare} label={ap.cardTotalMessages} value={metrics?.totalMessages ?? 0} description={ap.periodDays.replace('{period}', String(period))} isLoading={isLoading} />
                <MetricsCard icon={BarChart2}     label={ap.cardMsgsPerDay}    value={metrics ? `${metrics.messagesPerDay}/j` : '—'} isLoading={isLoading} />
                <MetricsCard icon={Users}         label={ap.cardSubscribers}   value={metrics?.activeSubscribers ?? 0} isLoading={isLoading} />
                <MetricsCard icon={TrendingUp}    label={ap.cardRetention}     value={metrics ? `${metrics.retentionRate}%` : '—'} isLoading={isLoading} />
                <MetricsCard icon={Calendar}      label={ap.cardConvsPerWeek}  value={metrics ? `${metrics.conversationsPerWeek}` : '—'} isLoading={isLoading} />
              </div>
              <AnalyticsChart data={metrics?.dailyData ?? []} isLoading={isLoading} />
            </TabsContent>

            {/* ── Session by country ─────────────────────────────────────── */}
            <TabsContent value="sessao-por-pais" className="mt-4 space-y-4">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
              ) : !metrics?.countryData?.length ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">{ap.noPeriodData}</p>
                </div>
              ) : (
                <div className="rounded-xl border bg-card p-5 space-y-3">
                  {metrics.countryData.map((row, i) => (
                    <div key={row.country} className="flex items-center gap-4">
                      <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                      <span className="w-32 text-sm font-medium truncate">{COUNTRY_LABELS[row.country] ?? row.country}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-muted h-2">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-semibold tabular-nums">{row.count}</span>
                      <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{row.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Activity by hour ──────────────────────────────────────── */}
            <TabsContent value="atividade-por-hora" className="mt-4 space-y-4">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
              ) : !metrics?.hourlyData?.some((h) => h.count > 0) ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">{ap.noPeriodData}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">{ap.hourlyDistribution}</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.hourlyData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 11, fill: '#71717a' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(h: number) => `${String(h).padStart(2, '0')}h`}
                          interval={1}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#71717a' }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          width={28}
                        />
                        <Tooltip content={<HourlyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {metrics.hourlyData.map((entry) => (
                            <Cell key={entry.hour} fill={HOUR_COLORS(entry.hour)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary" />{ap.hourlyMorning}</span>
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: 'hsl(220 70% 60%)' }} />{ap.hourlyLunch}</span>
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary" />{ap.hourlyAfternoon}</span>
                    <span><span className="mr-1 inline-block h-2 w-3 rounded-sm" style={{ background: 'hsl(280 60% 55%)' }} />{ap.hourlyEvening}</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="conversas" className="mt-6">
          <LeadConversationsPanel />
        </TabsContent>

      </Tabs>
    </div>
  );
}
