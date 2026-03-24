'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import type { SubscriptionStatus } from '@/generated/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useT } from '@/lib/i18n/use-t';

interface BillingCardProps {
  subscription: {
    id: string;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    specialist: { name: string; domain: string };
  } | null;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
  } | null;
}

function StatusBadge({
  status,
  cancelAtPeriodEnd,
}: {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
}) {
  const t = useT();

  if (status === 'ACTIVE' && !cancelAtPeriodEnd) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        {t.billingCard.statusActive}
      </Badge>
    );
  }
  if (status === 'ACTIVE' && cancelAtPeriodEnd) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        {t.billingCard.statusScheduled}
      </Badge>
    );
  }
  if (status === 'PAST_DUE') {
    return <Badge variant="destructive">{t.billingCard.statusPaymentFailed}</Badge>;
  }
  if (status === 'CANCELED' || status === 'EXPIRED') {
    return <Badge variant="outline">{t.billingCard.statusCanceled}</Badge>;
  }
  return <Badge variant="secondary">{t.billingCard.statusPending}</Badge>;
}

export function BillingCard({ subscription, paymentMethod }: BillingCardProps) {
  const t = useT();
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  // M3: Optimistic local state — reflects cancellation immediately before router.refresh() completes
  const [localCancelAtPeriodEnd, setLocalCancelAtPeriodEnd] = useState(
    subscription?.cancelAtPeriodEnd ?? false
  );

  function getCardTitle(status: SubscriptionStatus, cancelAtPeriodEnd: boolean): string {
    if (status === 'CANCELED' || status === 'EXPIRED') return t.billingCard.titleCanceled;
    if (status === 'PAST_DUE') return t.billingCard.titlePaymentFailed;
    if (cancelAtPeriodEnd) return t.billingCard.titleScheduled;
    return t.billingCard.titleActive;
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <p className="font-medium">{t.billingCard.noSubscription}</p>
          <p className="text-sm text-muted-foreground">{t.billingCard.noSubscriptionDesc}</p>
          <Button onClick={() => router.push('/')}>{t.billingCard.discover}</Button>
        </CardContent>
      </Card>
    );
  }

  async function handleOpenPortal() {
    setIsLoadingPortal(true);
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast.error(t.billingCard.portalError);
      }
    } catch {
      toast.error(t.billingCard.generalError);
    } finally {
      setIsLoadingPortal(false);
    }
  }

  async function handleCancel() {
    setIsCanceling(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        // M3: Optimistic update — badge and button change immediately without waiting for refresh
        setLocalCancelAtPeriodEnd(true);
        toast.success(t.billingCard.cancelSuccess);
        setIsCancelDialogOpen(false);
        router.refresh();
      } else {
        toast.error(t.billingCard.cancelError);
      }
    } catch {
      toast.error(t.billingCard.generalError);
    } finally {
      setIsCanceling(false);
    }
  }

  const formattedDate = subscription.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), 'd MMMM yyyy', { locale: fr })
    : null;

  const dateLabel = formattedDate
    ? localCancelAtPeriodEnd
      ? `${t.billingCard.accessUntil} ${formattedDate}`
      : `${t.billingCard.renewalOn} ${formattedDate}`
    : null;

  const brandDisplay = paymentMethod?.brand
    ? paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)
    : null;

  // H3: Only ACTIVE (non-cancelled) subscriptions can be cancelled
  // PAST_DUE users should update payment first via portal, not cancel
  const canCancel = !localCancelAtPeriodEnd && subscription.status === 'ACTIVE';

  return (
    <Card>
      <CardHeader>
        {/* M1: Dynamic title reflects true subscription state */}
        <CardTitle>{getCardTitle(subscription.status, localCancelAtPeriodEnd)}</CardTitle>
        <CardDescription>
          {subscription.specialist.name} ({subscription.specialist.domain})
        </CardDescription>
        <CardAction>
          <StatusBadge
            status={subscription.status}
            cancelAtPeriodEnd={localCancelAtPeriodEnd}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        {dateLabel && <p className="text-sm text-muted-foreground">{dateLabel}</p>}
        {brandDisplay && paymentMethod?.last4 && (
          <p className="text-sm text-muted-foreground">
            {t.billingCard.cardLabel} {brandDisplay} **** {paymentMethod.last4}
          </p>
        )}
      </CardContent>
      <Separator />
      <CardFooter className="flex flex-wrap gap-2 border-t-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenPortal}
          disabled={isLoadingPortal}
          aria-label={t.billingCard.managePortalAria}
        >
          {isLoadingPortal ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <ExternalLinkIcon className="size-3.5" />
          )}
          {t.billingCard.managePayment}
        </Button>

        {canCancel && (
          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              {t.billingCard.cancelSubscription}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.billingCard.cancelDialogTitle}</DialogTitle>
                <DialogDescription>
                  {t.billingCard.cancelDialogDescDate}{' '}
                  {formattedDate ?? t.billingCard.cancelDialogDescFallback}.{' '}
                  {t.billingCard.cancelDialogDescSuffix}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  {t.billingCard.keepSubscription}
                </DialogClose>
                <Button variant="destructive" onClick={handleCancel} disabled={isCanceling}>
                  {isCanceling && <Loader2Icon className="size-3.5 animate-spin" />}
                  {t.billingCard.cancelSubscription}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
