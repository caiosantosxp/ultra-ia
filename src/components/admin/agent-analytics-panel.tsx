'use client';

import { useState } from 'react';
import {
  BarChart2,
  Calendar,
  Clock,
  Globe,
  MessageSquare,
  MessagesSquare,
  TrendingUp,
  Users,
} from 'lucide-react';
import useSWR from 'swr';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { MetricsCardSkeleton } from '@/components/dashboard/metrics-card-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useT } from '@/lib/i18n/use-t';

type Period = 7 | 30 | 90;

interface Specialist {
  id: string;
  name: string;
  slug: string;
  domain: string;
  accentColor: string;
}

interface AgentMetrics {
  totalMessages: number;
  activeSubscribers: number;
  retentionRate: number;
  messagesPerDay: string;
  conversationsPerWeek: string;
  totalConversations: number;
  dailyData: Array<{ date: string; count: number }>;
  countryData: Array<{ country: string; count: number; percentage: number }>;
  hourlyData: Array<{ hour: number; count: number }>;
}

interface AgentAnalyticsPanelProps {
  specialists: Specialist[];
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

const BLUE = '#3B82F6';
const BLUE_LIGHT = '#60A5FA';

function HourlyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#1c1c1f',
        border: '1px solid #3f3f46',
        borderRadius: 8,
        padding: '8px 12px',
      }}
    >
      <p style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 2 }}>{label}h</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>{payload[0].value}</p>
    </div>
  );
}

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

export function AgentAnalyticsPanel({ specialists }: AgentAnalyticsPanelProps) {
  const t = useT();
  const ap = t.admin.analyticsPage;
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(30);

  const { data, isLoading, error } = useSWR<{ success: boolean; data: AgentMetrics }>(
    selectedSpecialistId
      ? `/api/admin/analytics?specialistId=${selectedSpecialistId}&period=${period}`
      : null,
    fetcher
  );

  const metrics = data?.data;

  const avgMsgsPerConv =
    metrics && metrics.totalConversations > 0
      ? (metrics.totalMessages / metrics.totalConversations).toFixed(1)
      : '—';

  const periodLabel = ap.periodDays.replace('{period}', String(period));

  const unitLabel = t.dateLocale === 'fr-FR' ? 'j' : 'd';

  return (
    <section aria-labelledby="agent-details-heading" className="space-y-8">
      {/* Section Header + Controls */}
      <div>
        <SectionLabel>{ap.agentDetails}</SectionLabel>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSpecialistId ?? ''} onValueChange={setSelectedSpecialistId}>
            <SelectTrigger className="w-[220px]" aria-label={ap.selectAgent}>
              <span className="truncate">
                {selectedSpecialistId
                  ? specialists.find((s) => s.id === selectedSpecialistId)?.name ?? ap.selectAgent
                  : ap.selectAgent}
              </span>
            </SelectTrigger>
            <SelectContent>
              {specialists.map((specialist) => (
                <SelectItem key={specialist.id} value={specialist.id}>
                  {specialist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={String(period)} onValueChange={(v) => setPeriod(Number(v) as Period)}>
            <TabsList>
              <TabsTrigger value="7">7 {unitLabel}</TabsTrigger>
              <TabsTrigger value="30">30 {unitLabel}</TabsTrigger>
              <TabsTrigger value="90">90 {unitLabel}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Empty state */}
      {!selectedSpecialistId ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">{ap.selectAgentPrompt}</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{ap.errorAgent}</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, i) => <MetricsCardSkeleton key={i} />)
            ) : (
              <>
                <MetricsCard
                  icon={MessageSquare}
                  label={ap.cardTotalMessages}
                  value={metrics?.totalMessages ?? 0}
                  description={periodLabel}
                />
                <MetricsCard
                  icon={BarChart2}
                  label={ap.cardMsgsPerDay}
                  value={metrics ? Number(metrics.messagesPerDay) : 0}
                  description={periodLabel}
                />
                <MetricsCard
                  icon={MessagesSquare}
                  label={ap.cardConversations}
                  value={metrics?.totalConversations ?? 0}
                  description={periodLabel}
                />
                <MetricsCard
                  icon={Calendar}
                  label={ap.cardConvsPerWeek}
                  value={metrics ? metrics.conversationsPerWeek : '—'}
                  description={periodLabel}
                />
                <MetricsCard
                  icon={Users}
                  label={ap.cardSubscribers}
                  value={metrics?.activeSubscribers ?? 0}
                />
                <MetricsCard
                  icon={TrendingUp}
                  label={ap.cardRetention}
                  value={metrics ? `${metrics.retentionRate}%` : '—'}
                  description={ap.retentionNote}
                />
                <MetricsCard
                  icon={BarChart2}
                  label={ap.cardAvgMsgs}
                  value={avgMsgsPerConv}
                  description={periodLabel}
                />
              </>
            )}
          </div>

          {/* Daily messages chart */}
          <div>
            <SectionLabel>{ap.dailyChartTitle}</SectionLabel>
            <AnalyticsChart
              data={metrics?.dailyData ?? []}
              isLoading={isLoading}
              valueLabel="msgs"
            />
          </div>

          {/* Hourly + Country */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Hourly activity bar chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {ap.hourlyChartTitle}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : !metrics?.hourlyData?.some((h) => h.count > 0) ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">{ap.noHourlyData}</p>
                  </div>
                ) : (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={metrics.hourlyData}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.07)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="hour"
                          tickFormatter={(h: number) => `${h}h`}
                          tick={{ fontSize: 10, fill: '#71717a' }}
                          tickLine={false}
                          axisLine={false}
                          interval={2}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#71717a' }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          width={24}
                        />
                        <Tooltip
                          content={<HourlyTooltip />}
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        />
                        <Bar
                          dataKey="count"
                          fill={BLUE}
                          radius={[3, 3, 0, 0]}
                          maxBarSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Country distribution */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {ap.countryTitle}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-7 w-full" />
                    ))}
                  </div>
                ) : !metrics?.countryData?.length ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">{ap.noCountryData}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {metrics.countryData.map(({ country, count, percentage }) => (
                      <div key={country}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium truncate max-w-[150px]">{country}</span>
                          <span className="text-muted-foreground ml-2 shrink-0 tabular-nums">
                            {count}{' '}
                            <span className="opacity-60">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%`, backgroundColor: BLUE_LIGHT }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
