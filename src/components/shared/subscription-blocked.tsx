'use client';

import type { SubscriptionStatus } from '@prisma/client';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <ShieldOff
            className="mb-2 h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>{description}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/pricing" className={buttonVariants({ variant: 'default' })}>
            {t.subscription.viewOffers}
          </Link>
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            {t.subscription.backHome}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
