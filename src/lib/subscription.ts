import type { Subscription, SubscriptionStatus } from '@/generated/prisma';

import { prisma } from '@/lib/prisma';

export type SubscriptionAccess = {
  hasAccess: boolean;
  status: SubscriptionStatus | 'none';
  isPastDue: boolean;
  isCancelScheduled: boolean;
  subscription: Subscription | null;
};

export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionAccess> {
  // TODO: Temporarily disabled - free access for all users
  // Re-enable subscription checks when ready to monetize
  return {
    hasAccess: true,
    status: 'ACTIVE',
    isPastDue: false,
    isCancelScheduled: false,
    subscription: null,
  };

  /* Original subscription check - uncomment to re-enable
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    return { hasAccess: false, status: 'none', isPastDue: false, isCancelScheduled: false, subscription: null };
  }

  const hasAccess = subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE';
  const isPastDue = subscription.status === 'PAST_DUE';
  const isCancelScheduled = subscription.cancelAtPeriodEnd;

  return { hasAccess, status: subscription.status, isPastDue, isCancelScheduled, subscription };
  */
}
