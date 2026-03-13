import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { EMAIL_TEMPLATES } from '@/lib/validations/email';


function formatDateFr(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date * 1000) : date;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmountFr(amountInCents: number | null, currency: string): string {
  if (!amountInCents) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
) {
  if (session.mode !== 'subscription') {
    // Registrar evento não-subscription para idempotência (AC #10)
    await prisma.processedStripeEvent.create({
      data: { eventId, type: 'checkout.session.completed' },
    });
    return;
  }

  const stripeSubscriptionId = session.subscription as string;
  const stripeCustomerId = session.customer as string;
  const userId = session.metadata?.userId;
  const specialistId = session.metadata?.specialistId;

  // H1: stripeCustomerId incluído no guard (session.customer pode ser null)
  if (!userId || !specialistId || !stripeSubscriptionId || !stripeCustomerId) {
    console.error('Missing required data in checkout.session.completed', {
      userId,
      specialistId,
      stripeSubscriptionId,
      stripeCustomerId,
    });
    // H4: Registrar evento mesmo sem processar — evita reprocessamento e satisfaz AC #10
    await prisma.processedStripeEvent.create({
      data: { eventId, type: 'checkout.session.completed' },
    });
    return;
  }

  // Buscar detalhes completos da subscription no Stripe (inclui items com period info)
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  // H2: item pode ser undefined — null-check defensivo (igual a subscription-updated.ts)
  const item = stripeSubscription.items.data[0];

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { stripeSubscriptionId },
      create: {
        userId,
        specialistId,
        stripeSubscriptionId,
        stripeCustomerId,
        status: 'ACTIVE',
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      update: {
        status: 'ACTIVE',
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : undefined,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : undefined,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    }),
    prisma.processedStripeEvent.create({
      data: { eventId, type: 'checkout.session.completed' },
    }),
  ]);

  // Enviar email de confirmação de assinatura (falha não bloqueia webhook — AC #2)
  try {
    const [user, specialist] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      prisma.specialist.findUnique({ where: { id: specialistId }, select: { name: true } }),
    ]);

    if (user && user.email && specialist) {
      const nextBillingDate = item
        ? formatDateFr(item.current_period_end)
        : formatDateFr(new Date());
      const amount = formatAmountFr(session.amount_total, session.currency ?? 'eur');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      const emailResult = await sendEmail({
        to: user.email!,
        template: EMAIL_TEMPLATES.SUBSCRIPTION_CONFIRMATION,
        variables: {
          userName: user.name ?? user.email ?? 'Utilisateur',
          specialistName: specialist.name,
          amount,
          nextBillingDate,
          chatUrl: `${appUrl}/chat`,
        },
      });
      if (!emailResult.success) {
        console.error('[checkout-completed] Subscription confirmation email failed:', emailResult.error);
      }
    }
  } catch (emailError) {
    Sentry.captureException(emailError, {
      tags: { context: 'subscription-confirmed-email', userId },
    });
  }
}
