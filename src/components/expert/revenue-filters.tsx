'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom';

export function RevenueFilters() {
  const rp = useT().admin.revenuePage;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const period = (searchParams.get('period') ?? 'all') as PeriodFilter;
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    fromParam
      ? { from: new Date(fromParam), to: toParam ? new Date(toParam) : undefined }
      : undefined,
  );

  const applyCustomRange = useCallback(() => {
    if (!range?.from) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', 'custom');
    params.set('from', format(range.from, 'yyyy-MM-dd'));
    if (range.to) {
      params.set('to', format(range.to, 'yyyy-MM-dd'));
    } else {
      params.delete('to');
    }
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }, [range, pathname, router, searchParams]);

  const clearCustomRange = useCallback(() => {
    setRange(undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('period');
    params.delete('from');
    params.delete('to');
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }, [pathname, router, searchParams]);

  const handlePeriodChange = useCallback(
    (value: string) => {
      setRange(undefined);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('from');
      params.delete('to');
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-sm gap-1.5')}>
        <CalendarDays className="h-3.5 w-3.5" />
        {period === 'custom' && fromParam
          ? `${format(new Date(fromParam), 'dd/MM/yy')}${toParam ? ` → ${format(new Date(toParam), 'dd/MM/yy')}` : ''}`
          : periodOptions.find((o) => o.value === period)?.label ?? rp.periodAll}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-2 border-b space-y-0.5">
          {periodOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => { handlePeriodChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                period === o.value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
        />
        <div className="flex items-center justify-end gap-2 p-3 border-t">
          <Button variant="ghost" size="sm" onClick={clearCustomRange}>
            {rp.periodClear}
          </Button>
          <Button size="sm" onClick={applyCustomRange} disabled={!range?.from}>
            {rp.periodApply}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
