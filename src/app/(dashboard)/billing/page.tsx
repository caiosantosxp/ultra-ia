import { redirect } from 'next/navigation';

import type Stripe from 'stripe';
import type { Metadata } from 'next';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { BillingCard } from '@/components/dashboard/billing-card';
import { PaymentBanner } from '@/components/dashboard/payment-banner';

export const metadata: Metadata = {
  title: 'Mon abonnement',
  description: 'Gérez votre abonnement Ultra IA',
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { notIn: ['EXPIRED'] },
    },
    include: {
      specialist: { select: { name: true, domain: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  let paymentMethod: { brand: string | null; last4: string | null } | null = null;

  if (subscription?.stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, {
        expand: ['default_payment_method'],
      });
      const pm = stripeSub.default_payment_method as Stripe.PaymentMethod | null;
      if (pm?.card) {
        paymentMethod = { brand: pm.card.brand, last4: pm.card.last4 };
      } else if (subscription.stripeCustomerId) {
        const customer = (await stripe.customers.retrieve(subscription.stripeCustomerId, {
          expand: ['invoice_settings.default_payment_method'],
        })) as Stripe.Customer;
        const fallbackPm = customer.invoice_settings
          ?.default_payment_method as Stripe.PaymentMethod | null;
        if (fallbackPm?.card) {
          paymentMethod = { brand: fallbackPm.card.brand, last4: fallbackPm.card.last4 };
        }
      }
    } catch (error) {
      console.error('[billing] Stripe retrieve error:', error);
    }
  }

  const isPastDue = subscription?.status === 'PAST_DUE';

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Mon abonnement</h1>
        <p className="text-muted-foreground">
          Gérez votre abonnement et vos informations de paiement.
        </p>
      </div>

      {isPastDue && <PaymentBanner />}

      <BillingCard
        subscription={
          subscription
            ? {
                id: subscription.id,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                specialist: subscription.specialist,
              }
            : null
        }
        paymentMethod={paymentMethod}
      />
    </div>
  );
}
