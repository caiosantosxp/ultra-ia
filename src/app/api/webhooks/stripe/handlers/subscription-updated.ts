import Stripe from 'stripe';
import { SubscriptionStatus } from '@/generated/prisma';

import { prisma } from '@/lib/prisma';

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'PAST_DUE';
    case 'paused':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'incomplete':
    case 'incomplete_expired':
      return 'CANCELED';
    default:
      return 'CANCELED';
  }
}

export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const stripeSubscriptionId = subscription.id;
  // No Stripe SDK v20+, current_period_start/end está no SubscriptionItem
  const item = subscription.items.data[0];

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),
    prisma.processedStripeEvent.create({
      data: { eventId, type: 'customer.subscription.updated' },
    }),
  ]);
}
