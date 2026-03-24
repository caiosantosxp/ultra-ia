'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button-variants';
import { useT } from '@/lib/i18n/use-t';

interface Props {
  specialistId: string;
  hasActiveSubscription?: boolean;
  autoCheckout?: boolean;
}

// TODO: Payments temporarily disabled - free access for all
// When re-enabling payments, restore the checkout flow
export function SubscribeButton({ specialistId }: Props) {
  const t = useT();

  return (
    <Link
      href="/chat"
      className={buttonVariants({
        className: 'w-full min-h-11 gap-2 text-base font-semibold'
      })}
    >
      {t.profile.startConversation}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
