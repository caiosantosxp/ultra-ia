'use client';

import { format } from 'date-fns';
import { fr as frLocale, enUS } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/use-t';

interface AnalyticsChartProps {
  data: Array<{ date: string; count: number }>;
  isLoading?: boolean;
  valueLabel?: string;
}

const BLUE = '#3B82F6';
const BLUE_LIGHT = '#60A5FA';

function useDateLocale() {
  const t = useT();
  return t.dateLocale === 'fr-FR' ? frLocale : enUS;
}

function CustomTooltip({
  active,
  payload,
  label,
  valueLabel,
  dateLocale,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueLabel?: string;
  dateLocale: ReturnType<typeof useDateLocale>;
}) {
  if (!active || !payload?.length || !label) return null;
  const val = payload[0].value;
  if (val === 0) return null;
  return (
    <div style={{ background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 2 }}>
        {format(new Date(label + 'T12:00:00'), 'd MMM yyyy', { locale: dateLocale })}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>
        {val}
        {valueLabel && (
          <span style={{ fontSize: 12, fontWeight: 400, color: '#a1a1aa' }}> {valueLabel}</span>
        )}
      </p>
    </div>
  );
}

export function AnalyticsChart({ data, isLoading, valueLabel }: AnalyticsChartProps) {
  const t = useT();
  const dateLocale = useDateLocale();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{t.admin.dashboard.noData}</p>
      </div>
    );
  }

  const interval = data.length > 15 ? Math.floor(data.length / 6) - 1 : 1;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.5} />
              <stop offset="80%" stopColor={BLUE} stopOpacity={0.05} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.07)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => format(new Date(v + 'T12:00:00'), 'd MMM', { locale: dateLocale })}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            interval={interval}
          />

          <YAxis
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
          />

          <Tooltip
            content={<CustomTooltip dateLocale={dateLocale} valueLabel={valueLabel} />}
            cursor={{ stroke: BLUE_LIGHT, strokeWidth: 1, strokeOpacity: 0.5, strokeDasharray: '4 4' }}
          />

          <Area
            type="monotone"
            dataKey="count"
            stroke={BLUE_LIGHT}
            strokeWidth={2.5}
            fill="url(#analyticsGradient)"
            dot={false}
            activeDot={{ r: 5, fill: BLUE_LIGHT, stroke: '#1c1c1f', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
