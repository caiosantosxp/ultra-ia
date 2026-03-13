'use client';

import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';

interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  const t = useT();
  return (
    <div
      role="complementary"
      aria-label={t.disclaimer.ariaLabel}
      className={cn(
        'flex items-center gap-2 bg-muted/50 px-0 py-1',
        className
      )}
    >
      <Info className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">
        {t.disclaimer.text}
      </p>
    </div>
  );
}
