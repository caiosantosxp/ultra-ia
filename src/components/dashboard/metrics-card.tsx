'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsCardSkeleton } from '@/components/dashboard/metrics-card-skeleton';
import { useT } from '@/lib/i18n/use-t';

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  prefix?: string;
  suffix?: string;
  description?: string;
  isLoading?: boolean;
}

function TrendIndicator({ trend }: { trend: number }) {
  const t = useT();
  const isPositive = trend >= 0;
  return (
    <p className={cn('mt-1 text-xs', isPositive ? 'text-green-600' : 'text-red-600')}>
      {isPositive ? '↑' : '↓'} {Math.abs(trend)}% {t.common.vsPrevious}
    </p>
  );
}

export function MetricsCard({
  icon: Icon,
  label,
  value,
  trend,
  prefix,
  suffix,
  description,
  isLoading,
}: MetricsCardProps) {
  if (isLoading) {
    return <MetricsCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {value}
          {suffix}
        </div>
        {trend !== undefined && <TrendIndicator trend={trend} />}
        {description && trend === undefined && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
