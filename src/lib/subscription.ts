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
}
