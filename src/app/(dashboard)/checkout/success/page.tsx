import { redirect } from 'next/navigation';
import Link from 'next/link';
import type Stripe from 'stripe';

import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

function CheckoutError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-bold">Paiement non complété</h1>
        <p className="mt-3 text-muted-foreground">
          Votre paiement n&apos;a pas été confirmé. Veuillez réessayer.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { session_id } = await searchParams;
  if (!session_id) redirect('/');

  // Retrieve Checkout Session from Stripe
  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });
  } catch {
    return <CheckoutError />;
  }

  if (checkoutSession.payment_status !== 'paid') {
    return <CheckoutError />;
  }

  const subscription = checkoutSession.subscription as Stripe.Subscription;
  const { userId, specialistId } = checkoutSession.metadata ?? {};

  if (!userId || !specialistId || !subscription) {
    return <CheckoutError />;
  }

  // Security: validate userId from Stripe metadata matches the authenticated user
  if (userId !== session.user.id) {
    return <CheckoutError />;
  }

  // Idempotent: check if subscription already exists (AC #9 - user returns to success URL)
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existing) {
    // In Stripe API 2026-02-25.clover, period dates are on subscription items
    const subItem = subscription.items?.data?.[0];
    const periodStart = subItem?.current_period_start
      ? new Date(subItem.current_period_start * 1000)
      : null;
    const periodEnd = subItem?.current_period_end
      ? new Date(subItem.current_period_end * 1000)
      : null;

    await prisma.subscription.create({
      data: {
        userId,
        specialistId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: checkoutSession.customer as string,
        status: 'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });

    // Save stripeCustomerId on user if not already saved
    await prisma.user.updateMany({
      where: { id: userId, stripeCustomerId: null },
      data: { stripeCustomerId: checkoutSession.customer as string },
    });
  }

  redirect('/chat');
}
