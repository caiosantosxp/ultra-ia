'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

interface ExpertSubscriptionsChartProps {
  data: Array<{ date: string; count: number }>;
}

const chartConfig: ChartConfig = {
  count: {
    label: 'Abonnements',
    color: 'hsl(var(--primary))',
  },
};

export function ExpertSubscriptionsChart({ data }: ExpertSubscriptionsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-xs text-muted-foreground">Aucun abonnement sur 90 jours</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(new Date(v), 'd MMM', { locale: ptBR })}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
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
