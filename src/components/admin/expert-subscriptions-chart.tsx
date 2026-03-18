'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpertSubscriptionsChartProps {
  data: Array<{ date: string; count: number }>;
}

const BLUE = '#3B82F6';
const BLUE_LIGHT = '#60A5FA';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  const val = payload[0].value;
  if (val === 0) return null;
  return (
    <div style={{ background: '#1c1c1f', border: '1px solid #3f3f46', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 2 }}>
        {format(new Date(label + 'T12:00:00'), 'd MMM yyyy', { locale: ptBR })}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#fafafa' }}>
        {val}{' '}
        <span style={{ fontSize: 12, fontWeight: 400, color: '#a1a1aa' }}>
          abonnement{val !== 1 ? 's' : ''}
        </span>
      </p>
    </div>
  );
}

export function ExpertSubscriptionsChart({ data }: ExpertSubscriptionsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-xs text-muted-foreground">Aucun abonnement sur 90 jours</p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="subsGradient" x1="0" y1="0" x2="0" y2="1">
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
            tickFormatter={(v: string) => format(new Date(v + 'T12:00:00'), 'd MMM', { locale: ptBR })}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            interval={13}
          />

          <YAxis
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: BLUE_LIGHT, strokeWidth: 1, strokeOpacity: 0.5, strokeDasharray: '4 4' }}
          />

          <Area
            type="monotone"
            dataKey="count"
            stroke={BLUE_LIGHT}
            strokeWidth={2.5}
            fill="url(#subsGradient)"
            dot={false}
            activeDot={{ r: 5, fill: BLUE_LIGHT, stroke: '#1c1c1f', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
