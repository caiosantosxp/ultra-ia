'use client';

import { CalendarDays } from 'lucide-react';
import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

type PeriodOption = 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_6_months' | 'this_year' | 'custom';

function getDaysForOption(option: PeriodOption, range?: DateRange): number {
  const now = new Date();
  switch (option) {
    case 'last_7_days': return 7;
    case 'last_30_days': return 30;
    case 'last_3_months': return 90;
    case 'last_6_months': return 180;
    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.max(1, Math.ceil((now.getTime() - startOfYear.getTime()) / 86400000));
    }
    case 'custom': {
      if (!range?.from) return 30;
      const end = range.to ?? now;
      return Math.max(1, Math.ceil((end.getTime() - range.from.getTime()) / 86400000));
    }
    default: return 30;
  }
}

interface DashboardPeriodFilterProps {
  onChange: (days: number) => void;
}

export function DashboardPeriodFilter({ onChange }: DashboardPeriodFilterProps) {
  const d = useT().admin.dashboard;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PeriodOption>('last_30_days');
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [customLabel, setCustomLabel] = useState<string | null>(null);

  const periodOptions: { value: PeriodOption; label: string }[] = [
    { value: 'last_7_days', label: d.period7d },
    { value: 'last_30_days', label: d.period30d },
    { value: 'last_3_months', label: d.periodLast3Months },
    { value: 'last_6_months', label: d.periodLast6Months },
    { value: 'this_year', label: d.periodThisYear },
  ];

  const handleSelect = useCallback(
    (option: PeriodOption) => {
      setSelected(option);
      setRange(undefined);
      setCustomLabel(null);
      setOpen(false);
      onChange(getDaysForOption(option));
    },
    [onChange],
  );

  const applyCustomRange = useCallback(() => {
    if (!range?.from) return;
    const label = `${format(range.from, 'dd/MM/yy')}${range.to ? ` → ${format(range.to, 'dd/MM/yy')}` : ''}`;
    setSelected('custom');
    setCustomLabel(label);
    setOpen(false);
    onChange(getDaysForOption('custom', range));
  }, [range, onChange]);

  const clearCustomRange = useCallback(() => {
    setRange(undefined);
    setCustomLabel(null);
    setSelected('last_30_days');
    setOpen(false);
    onChange(30);
  }, [onChange]);

  const triggerLabel =
    selected === 'custom' && customLabel
      ? customLabel
      : periodOptions.find((o) => o.value === selected)?.label ?? d.period30d;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 text-sm gap-1.5')}>
        <CalendarDays className="h-3.5 w-3.5" />
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        {/* Predefined options */}
        <div className="p-2 border-b space-y-0.5">
          {periodOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => handleSelect(o.value)}
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                selected === o.value && selected !== 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {/* Custom range calendar */}
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          disabled={{ after: new Date() }}
        />
        <div className="flex items-center justify-end gap-2 p-3 border-t">
          <Button variant="ghost" size="sm" onClick={clearCustomRange}>
            {d.periodClear}
          </Button>
          <Button size="sm" onClick={applyCustomRange} disabled={!range?.from}>
            {d.periodApply}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
