'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button-variants';
import { useT } from '@/lib/i18n/use-t';

export function PaymentBanner() {
  const t = useT();

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-sm font-medium">{t.paymentBanner.text}</p>
      </div>
      <Link
        href="/billing"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        {t.paymentBanner.update}
      </Link>
    </div>
  );
}
