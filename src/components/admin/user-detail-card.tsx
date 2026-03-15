'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, Clock, XCircle } from 'lucide-react';
import type { SubscriptionStatus } from '@prisma/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/lib/i18n/use-t';

interface Specialist {
  name: string;
  domain: string;
  accentColor: string;
}

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  specialist: Specialist;
}

interface UserDetailCardProps {
  userId: string;
  subscriptions: Subscription[];
}

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const t = useT();
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{t.admin.userSubscriptions.statusActive}</Badge>;
    case 'PAST_DUE':
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{t.admin.userSubscriptions.statusPastDue}</Badge>
      );
    case 'CANCELED':
      return <Badge variant="secondary">{t.admin.userSubscriptions.statusCanceled}</Badge>;
    case 'EXPIRED':
      return <Badge variant="secondary">{t.admin.userSubscriptions.statusExpired}</Badge>;
    case 'PENDING':
      return <Badge variant="outline">{t.admin.userSubscriptions.statusPending}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SubscriptionActions({
  userId,
  subscription,
}: {
  userId: string;
  subscription: Subscription;
}) {
  const router = useRouter();
  const t = useT();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const canTakeActions =
    subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE';

  async function handleGeneratePortalLink() {
    setIsGeneratingLink(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-portal-link' }),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedLink(json.data.url);
        toast.success(t.admin.userSubscriptions.portalLinkSuccess);
      } else {
        toast.error(json.error?.message ?? t.admin.userSubscriptions.portalLinkError);
      }
    } catch {
      toast.error(t.admin.userSubscriptions.portalLinkNetworkError);
    } finally {
      setIsGeneratingLink(false);
    }
  }

  async function handleExtendGracePeriod() {
    setIsExtending(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extend-grace-period' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t.admin.userSubscriptions.extendSuccess);
        router.refresh();
      } else {
        toast.error(json.error?.message ?? t.admin.userSubscriptions.extendError);
      }
    } catch {
      toast.error(t.admin.userSubscriptions.extendNetworkError);
    } finally {
      setIsExtending(false);
    }
  }

  async function handleCancelSubscription() {
    setIsCanceling(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel-subscription', subscriptionId: subscription.id }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(t.admin.userSubscriptions.cancelSuccess);
        router.refresh();
      } else {
        toast.error(json.error?.message ?? t.admin.userSubscriptions.cancelError);
      }
    } catch {
      toast.error(t.admin.userSubscriptions.cancelNetworkError);
    } finally {
      setIsCanceling(false);
    }
  }

  async function handleCopyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success(t.admin.userSubscriptions.copySuccess);
    } catch {
      toast.error(t.admin.userSubscriptions.copyError);
    }
  }

  return (
    <div className="space-y-3">
      {canTakeActions && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePortalLink}
            disabled={isGeneratingLink}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {isGeneratingLink ? t.admin.userSubscriptions.generating : t.admin.userSubscriptions.generateLink}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              disabled={isExtending}
            >
              <Clock className="mr-2 h-4 w-4" />
              {isExtending ? t.admin.userSubscriptions.extending : t.admin.userSubscriptions.extend7Days}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.admin.userSubscriptions.confirmExtensionTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.admin.userSubscriptions.confirmExtensionDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.admin.userSubscriptions.back}</AlertDialogCancel>
                <AlertDialogAction onClick={handleExtendGracePeriod}>
                  {t.admin.userSubscriptions.confirmExtensionBtn}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {subscription.status === 'ACTIVE' && (
            <AlertDialog>
              <AlertDialogTrigger
                className={buttonVariants({ variant: 'destructive', size: 'sm' })}
                disabled={isCanceling}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isCanceling ? t.admin.userSubscriptions.canceling : t.admin.userSubscriptions.cancelSubscription}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.admin.userSubscriptions.cancelViaStripeTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.admin.userSubscriptions.cancelViaStripeDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.admin.userSubscriptions.back}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className={buttonVariants({ variant: 'destructive' })}
                  >
                    {t.admin.userSubscriptions.confirmCancel}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {generatedLink && (
        <div className="rounded-md border bg-muted p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {t.admin.userSubscriptions.generatedLink}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded text-xs">{generatedLink}</code>
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function UserDetailCard({ userId, subscriptions }: UserDetailCardProps) {
  const t = useT();

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.admin.userSubscriptions.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.admin.userSubscriptions.noSubscriptions}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.admin.userSubscriptions.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="rounded-md border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{sub.specialist.name}</p>
                <p className="text-sm text-muted-foreground">{sub.specialist.domain}</p>
              </div>
              <SubscriptionStatusBadge status={sub.status} />
            </div>

            {(sub.currentPeriodStart || sub.currentPeriodEnd) && (
              <div className="text-xs text-muted-foreground">
                {sub.currentPeriodStart && (
                  <span>
                    {t.admin.userSubscriptions.startDate}: {new Date(sub.currentPeriodStart).toLocaleDateString(t.dateLocale)}
                  </span>
                )}
                {sub.currentPeriodStart && sub.currentPeriodEnd && ' → '}
                {sub.currentPeriodEnd && (
                  <span>
                    {t.admin.userSubscriptions.endDate}: {new Date(sub.currentPeriodEnd).toLocaleDateString(t.dateLocale)}
                  </span>
                )}
                {sub.cancelAtPeriodEnd && (
                  <span className="ml-2 text-orange-600">({t.admin.userSubscriptions.scheduledCancellation})</span>
                )}
              </div>
            )}

            <SubscriptionActions userId={userId} subscription={sub} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
