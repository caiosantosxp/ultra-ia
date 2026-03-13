'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface AnalyticsChartProps {
  data: Array<{ date: string; count: number }>;
  isLoading?: boolean;
}

const chartConfig: ChartConfig = {
  count: {
    label: 'Mensagens',
    color: 'hsl(var(--primary))',
  },
};

export function AnalyticsChart({ data, isLoading }: AnalyticsChartProps) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Nenhum dado para este período</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => format(new Date(value), 'd MMM', { locale: ptBR })}
          className="text-xs text-muted-foreground"
          tick={{ fontSize: 12 }}
        />
        <YAxis className="text-xs text-muted-foreground" tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
