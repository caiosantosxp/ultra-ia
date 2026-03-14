'use client';

import { useCallback, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { createCheckoutSession } from '@/actions/subscription-actions';
import { useT } from '@/lib/i18n/use-t';

interface Props {
  specialistId: string;
  hasActiveSubscription: boolean;
  autoCheckout?: boolean;
}

export function SubscribeButton({ specialistId, hasActiveSubscription, autoCheckout }: Props) {
  const router = useRouter();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const autoCheckoutTriggeredRef = useRef(false);

  const handleSubscribe = useCallback(() => {
    startTransition(async () => {
      const result = await createCheckoutSession({ specialistId });
      if (result.success) {
        const redirectTo = 'redirectTo' in result.data ? result.data.redirectTo : undefined;
        const checkoutUrl =
          'checkoutUrl' in result.data ? result.data.checkoutUrl : undefined;
        if (redirectTo) {
          router.push(redirectTo);
        } else if (checkoutUrl) {
          window.location.href = checkoutUrl;
        }
      } else {
        toast.error(result.error.message);
      }
    });
  }, [specialistId, router]);

  // FR4: Auto-trigger checkout after post-registration redirect (?checkout=true)
  useEffect(() => {
    if (autoCheckout && !hasActiveSubscription && !autoCheckoutTriggeredRef.current) {
      autoCheckoutTriggeredRef.current = true;
      handleSubscribe();
    }
  }, [autoCheckout, hasActiveSubscription, handleSubscribe]);

  if (hasActiveSubscription) {
    return (
      <Link href="/chat" className={buttonVariants({ className: 'w-full min-h-11' })}>
        {t.profile.accessChat}
      </Link>
    );
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isPending}
      className="w-full min-h-11"
      aria-label={t.profile.startConversationExpert}
    >
      {isPending ? t.profile.subscribing : t.profile.startConversation}
    </Button>
  );
}
