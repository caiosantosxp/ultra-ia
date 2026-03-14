'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import useSWR from 'swr';
import { BarChart2, Calendar, MessageSquare, Mic, ThumbsUp, TrendingUp, Users, MessageCircle } from 'lucide-react';

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

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error('err'); return r.json(); });

export default function ExpertAnalyticsPage() {
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(30);

  useEffect(() => {
    // Get specialistId from the expert's linked specialist via API
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
            {([7, 30, 90] as Period[]).map((p) => (
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
            <TabsContent value="atividade-detalhada" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                <MetricsCard icon={MessageSquare} label="Total mensagens" value={metrics?.totalMessages ?? 0} description={`Últimos ${period} dias`} isLoading={isLoading} />
                <MetricsCard icon={BarChart2} label="Msgs/dia" value={metrics ? `${metrics.messagesPerDay}/dia` : '—'} isLoading={isLoading} />
                <MetricsCard icon={Users} label="Assinantes ativos" value={metrics?.activeSubscribers ?? 0} isLoading={isLoading} />
                <MetricsCard icon={TrendingUp} label="Retenção" value={metrics ? `${metrics.retentionRate}%` : '—'} isLoading={isLoading} />
                <MetricsCard icon={Calendar} label="Conversas/sem" value={metrics ? `${metrics.conversationsPerWeek}/sem` : '—'} isLoading={isLoading} />
              </div>
              <AnalyticsChart data={metrics?.dailyData ?? []} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="sessao-por-pais" className="mt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Données de géolocalisation disponibles prochainement</p>
              </div>
            </TabsContent>
            <TabsContent value="atividade-por-hora" className="mt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Analyse par heure disponible prochainement</p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="conversas" className="mt-6">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-2 text-muted-foreground"><MessageCircle className="h-8 w-8" /><p className="text-sm">Liste des conversations disponible prochainement</p></div>
          </div>
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
