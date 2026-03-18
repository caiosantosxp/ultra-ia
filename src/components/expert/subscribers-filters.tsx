'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { useCallback } from 'react';

import { useT } from '@/lib/i18n/use-t';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StatusFilter = 'all' | 'active' | 'new' | 'past_due' | 'canceled' | 'expired' | 'pending';
type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';

export function SubscribersFilters() {
  const sp = useT().admin.subscribersPage;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = (searchParams.get('status') ?? 'all') as StatusFilter;
  const period = (searchParams.get('period') ?? 'all') as PeriodFilter;

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: sp.filterAll },
    { value: 'active', label: sp.filterActive },
    { value: 'new', label: sp.filterNew },
    { value: 'past_due', label: sp.filterFailed },
    { value: 'canceled', label: sp.filterCancelled },
    { value: 'expired', label: sp.filterExpired },
    { value: 'pending', label: sp.filterPending },
  ];

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: sp.periodAll },
    { value: 'this_month', label: sp.periodThisMonth },
    { value: 'last_month', label: sp.periodLastMonth },
    { value: 'last_3_months', label: sp.periodLast3Months },
    { value: 'last_6_months', label: sp.periodLast6Months },
    { value: 'this_year', label: sp.periodThisYear },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => update('status', f.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              status === f.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date period selector */}
      <div className="ml-auto flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <Select value={period} onValueChange={(v) => update('period', v)}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
