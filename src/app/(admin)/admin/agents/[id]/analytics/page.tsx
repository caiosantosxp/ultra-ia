'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { BarChart2, Calendar, MessageCircle, MessageSquare, Mic, ThumbsUp, TrendingUp, Users } from 'lucide-react';

import { AnalyticsChart } from '@/components/admin/analytics-chart';
import { MetricsCard } from '@/components/dashboard/metrics-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="conversas">Conversas</TabsTrigger>
          <TabsTrigger value="chamadas">Chamadas</TabsTrigger>
          <TabsTrigger value="opiniao">Opinião</TabsTrigger>
        </TabsList>

        {/* ── Métricas ── */}
        <TabsContent value="metricas" className="mt-6 space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
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
                {p} dias
              </button>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive">Erro ao carregar métricas.</p>
          )}

          {/* Sub-tabs */}
          <Tabs defaultValue="atividade-detalhada">
            <TabsList>
              <TabsTrigger value="atividade-detalhada">Atividade detalhada</TabsTrigger>
              <TabsTrigger value="sessao-por-pais">Sessão por país</TabsTrigger>
              <TabsTrigger value="atividade-por-hora">Atividade por hora</TabsTrigger>
            </TabsList>

            <TabsContent value="atividade-detalhada" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <MetricsCard
                  icon={MessageSquare}
                  label="Total de mensagens"
                  value={metrics?.totalMessages ?? 0}
                  description={`Últimos ${period} dias`}
                  isLoading={isLoading}
                />
                <MetricsCard
                  icon={BarChart2}
                  label="Msgs/dia"
                  value={metrics ? `${metrics.messagesPerDay}/dia` : '—'}
                  description={`Média ${period} dias`}
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
                  isLoading={isLoading}
                />
                <MetricsCard
                  icon={Calendar}
                  label="Conversas/semana"
                  value={metrics ? `${metrics.conversationsPerWeek}/sem` : '—'}
                  isLoading={isLoading}
                />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  Mensagens por dia (últimos {period} dias)
                </h3>
                <AnalyticsChart data={metrics?.dailyData ?? []} isLoading={isLoading} />
              </div>
            </TabsContent>

            <TabsContent value="sessao-por-pais" className="mt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Dados de geolocalização disponíveis em breve
                </p>
              </div>
            </TabsContent>

            <TabsContent value="atividade-por-hora" className="mt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Análise por hora disponível em breve
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Conversas ── */}
        <TabsContent value="conversas" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <MessageCircle className="h-8 w-8" />
              <p className="text-sm">Lista de conversas disponível em breve</p>
            </div>
          </div>
        </TabsContent>

        {/* ── Chamadas ── */}
        <TabsContent value="chamadas" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Mic className="h-8 w-8" />
              <p className="text-sm">Histórico de chamadas disponível em breve</p>
            </div>
          </div>
        </TabsContent>

        {/* ── Opinião ── */}
        <TabsContent value="opiniao" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ThumbsUp className="h-8 w-8" />
              <p className="text-sm">Avaliações e opiniões disponíveis em breve</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
