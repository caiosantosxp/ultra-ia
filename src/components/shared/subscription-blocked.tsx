'use client';

import type { SubscriptionStatus } from '@/generated/prisma';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';

import { useT } from '@/lib/i18n/use-t';

type Status = SubscriptionStatus | 'none';

interface SubscriptionBlockedPageProps {
  status: Status;
}

export function SubscriptionBlockedPage({ status }: SubscriptionBlockedPageProps) {
  const t = useT();

  const messages: Record<Status, { title: string; description: string }> = {
    CANCELED: t.subscription.canceled,
    EXPIRED: t.subscription.expired,
    PENDING: t.subscription.pending,
    PAST_DUE: t.subscription.pastDue,
    ACTIVE: t.subscription.active,
    none: t.subscription.none,
  };

  const { title, description } = messages[status] ?? t.subscription.none;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4">
      <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fef2f2]">
            <ShieldOff
              className="h-8 w-8 text-[#ef4444]"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-xl font-semibold text-[#161616]">{title}</h1>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-[#787878] leading-relaxed">{description}</p>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-[#e5e7eb] px-6 py-6 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0367fb] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0256d4]"
          >
            {t.subscription.viewOffers}
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white px-6 text-sm font-medium text-[#161616] transition-colors hover:bg-[#f3f3f3]"
          >
            {t.subscription.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
