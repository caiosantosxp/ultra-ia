'use client';

import { useState } from 'react';

import { BarChart2, Calendar, MessageSquare, TrendingUp, Users } from 'lucide-react';
import useSWR from 'swr';

import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  dailyData: Array<{ date: string; count: number }>;
}

interface AgentAnalyticsPanelProps {
  specialists: Specialist[];
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export function AgentAnalyticsPanel({ specialists }: AgentAnalyticsPanelProps) {
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(30);

  const {
    data,
    isLoading,
    error,
  } = useSWR<{ success: boolean; data: AgentMetrics }>(
    selectedSpecialistId
      ? `/api/admin/analytics?specialistId=${selectedSpecialistId}&period=${period}`
      : null,
    fetcher
  );

  const metrics = data?.data;

  return (
    <section aria-labelledby="agent-details-heading">
      <h2 id="agent-details-heading" className="mb-4 text-lg font-semibold">
        Detalhes por agente
      </h2>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={selectedSpecialistId ?? ''} onValueChange={setSelectedSpecialistId}>
          <SelectTrigger className="w-[220px]" aria-label="Selecionar agente">
            <SelectValue placeholder="Selecionar um agente" />
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
          <TabsList aria-label="Período de análise">
            <TabsTrigger value="7">7 dias</TabsTrigger>
            <TabsTrigger value="30">30 dias</TabsTrigger>
            <TabsTrigger value="90">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!selectedSpecialistId ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            Selecione um agente para ver as métricas detalhadas
          </p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Erro ao carregar métricas do agente. Tente selecionar novamente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <MetricsCard
              icon={MessageSquare}
              label="Total de mensagens"
              value={metrics?.totalMessages ?? 0}
              description={`Nos últimos ${period} dias`}
              isLoading={isLoading}
            />
            <MetricsCard
              icon={BarChart2}
              label="Msgs/dia"
              value={metrics ? `${metrics.messagesPerDay}/dia` : '—'}
              description={`Média nos últimos ${period} dias`}
              isLoading={isLoading}
            />
            <MetricsCard
              icon={Users}
              label="Assinantes ativos"
              value={metrics?.activeSubscribers ?? 0}
              isLoading={isLoading}
            />
            <MetricsCard
              icon={TrendingUp}
              label="Retenção"
              value={metrics ? `${metrics.retentionRate}%` : '—'}
              description="Assinantes ativos / histórico"
              isLoading={isLoading}
            />
            <MetricsCard
              icon={Calendar}
              label="Conversas/semana"
              value={metrics ? `${metrics.conversationsPerWeek}/sem` : '—'}
              description={`Nos últimos ${period} dias`}
              isLoading={isLoading}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Mensagens por dia (últimos {period} dias)
            </h3>
            <AnalyticsChart data={metrics?.dailyData ?? []} isLoading={isLoading} />
          </div>
        </div>
      )}
    </section>
  );
}
