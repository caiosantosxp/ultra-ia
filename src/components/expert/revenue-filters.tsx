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

type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';

export function RevenueFilters() {
  const rp = useT().admin.revenuePage;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = (searchParams.get('period') ?? 'all') as PeriodFilter;

  const update = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete('period');
      } else {
        params.set('period', value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: 'all',           label: rp.periodAll },
    { value: 'this_month',    label: rp.periodThisMonth },
    { value: 'last_month',    label: rp.periodLastMonth },
    { value: 'last_3_months', label: rp.periodLast3Months },
    { value: 'last_6_months', label: rp.periodLast6Months },
    { value: 'this_year',     label: rp.periodThisYear },
  ];

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Select value={period} onValueChange={update}>
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
  );
}
