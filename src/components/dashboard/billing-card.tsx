'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import type { SubscriptionStatus } from '@prisma/client';
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
  if (status === 'ACTIVE' && !cancelAtPeriodEnd) {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Actif
      </Badge>
    );
  }
  if (status === 'ACTIVE' && cancelAtPeriodEnd) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        Annulation planifiée
      </Badge>
    );
  }
  if (status === 'PAST_DUE') {
    return <Badge variant="destructive">Paiement échoué</Badge>;
  }
  if (status === 'CANCELED' || status === 'EXPIRED') {
    return <Badge variant="outline">Annulé</Badge>;
  }
  return <Badge variant="secondary">En attente</Badge>;
}

// M1: Dynamic title based on subscription status
function getCardTitle(status: SubscriptionStatus, cancelAtPeriodEnd: boolean): string {
  if (status === 'CANCELED' || status === 'EXPIRED') return 'Abonnement annulé';
  if (status === 'PAST_DUE') return 'Paiement en échec';
  if (cancelAtPeriodEnd) return 'Annulation planifiée';
  return 'Abonnement actif';
}

export function BillingCard({ subscription, paymentMethod }: BillingCardProps) {
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  // M3: Optimistic local state — reflects cancellation immediately before router.refresh() completes
  const [localCancelAtPeriodEnd, setLocalCancelAtPeriodEnd] = useState(
    subscription?.cancelAtPeriodEnd ?? false
  );

  if (!subscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <p className="font-medium">Aucun abonnement actif</p>
          <p className="text-sm text-muted-foreground">
            Abonnez-vous à un spécialiste IA pour commencer à utiliser la plateforme.
          </p>
          <Button onClick={() => router.push('/')}>Découvrir les spécialistes</Button>
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
        toast.error("Impossible d'ouvrir le portail de paiement.");
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
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
        toast.success(
          "Votre abonnement a été annulé. L'accès reste actif jusqu'à la fin de la période."
        );
        setIsCancelDialogOpen(false);
        router.refresh();
      } else {
        toast.error("Impossible d'annuler l'abonnement.");
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsCanceling(false);
    }
  }

  const formattedDate = subscription.currentPeriodEnd
    ? format(new Date(subscription.currentPeriodEnd), 'd MMMM yyyy', { locale: fr })
    : null;

  const dateLabel = formattedDate
    ? localCancelAtPeriodEnd
      ? `Accès jusqu'au ${formattedDate}`
      : `Renouvellement le ${formattedDate}`
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
            Carte : {brandDisplay} **** {paymentMethod.last4}
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
          aria-label="Ouvrir le portail de gestion du paiement Stripe"
        >
          {isLoadingPortal ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <ExternalLinkIcon className="size-3.5" />
          )}
          Gérer le paiement
        </Button>

        {canCancel && (
          <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              Annuler l&apos;abonnement
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Annuler votre abonnement ?</DialogTitle>
                <DialogDescription>
                  Votre accès restera actif jusqu&apos;au{' '}
                  {formattedDate ?? 'la fin de la période'}.{' '}
                  Après cette date, vous perdrez l&apos;accès à votre spécialiste IA.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Conserver mon abonnement
                </DialogClose>
                <Button variant="destructive" onClick={handleCancel} disabled={isCanceling}>
                  {isCanceling && <Loader2Icon className="size-3.5 animate-spin" />}
                  Annuler l&apos;abonnement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
