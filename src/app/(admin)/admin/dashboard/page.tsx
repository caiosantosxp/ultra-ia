'use client';

import useSWR from 'swr';
import { BarChart, RefreshCw, TrendingUp, Users, MessageSquare } from 'lucide-react';

import { MetricsCard } from '@/components/dashboard/metrics-card';
import { MetricsCardSkeleton } from '@/components/dashboard/metrics-card-skeleton';
import { Button } from '@/components/ui/button';
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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
          aria-label="Atualizar métricas"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Erro ao carregar métricas.{' '}
            <button
              onClick={() => mutate()}
              className="underline hover:no-underline"
            >
              Tentar novamente
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
          </>
        ) : (
          <>
            <MetricsCard
              icon={Users}
              label="Assinantes Ativos"
              value={metrics?.activeSubscribers ?? 0}
              trend={metrics?.activeSubscribersTrend}
            />
            <MetricsCard
              icon={MessageSquare}
              label="Mensagens Hoje"
              value={metrics?.messagesToday ?? 0}
              trend={metrics?.messagesTodayTrend}
            />
            <MetricsCard
              icon={BarChart}
              label="Receita Mensal (MRR)"
              value={metrics ? formatMRR(metrics.mrr) : '—'}
              trend={metrics?.mrrTrend}
            />
            <MetricsCard
              icon={TrendingUp}
              label="Taxa de Retenção"
              value={metrics ? `${metrics.retentionRate}%` : '—'}
              trend={metrics?.retentionRateTrend}
            />
          </>
        )}
      </div>
    </div>
  );
}
