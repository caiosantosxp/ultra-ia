import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const stripeSubscriptionId = subscription.id;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { status: 'CANCELED', cancelAtPeriodEnd: false },
    }),
    prisma.processedStripeEvent.create({
      data: { eventId, type: 'customer.subscription.deleted' },
    }),
  ]);
}
