import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { EMAIL_TEMPLATES } from '@/lib/validations/email';


function formatDateFr(timestampSeconds: number): string {
  const d = new Date(timestampSeconds * 1000);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmountFr(amountInCents: number | null, currency: string): string {
  if (!amountInCents) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  // No Stripe SDK v20+, subscription ID está em invoice.parent.subscription_details.subscription
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId =
    typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;

  if (!stripeSubscriptionId) {
    // Registrar evento para evitar reprocessamento e satisfazer AC #10
    await prisma.processedStripeEvent.create({
      data: { eventId, type: 'invoice.paid' },
    });
    return;
  }

  const periodStart = invoice.period_start;
  const periodEnd = invoice.period_end;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
    }),
    prisma.processedStripeEvent.create({
      data: { eventId, type: 'invoice.paid' },
    }),
  ]);

  // Enviar email de confirmação apenas para renovações (não para a assinatura inicial — AC #4)
  // billing_reason 'subscription_cycle' = renovação automática; 'subscription_update' = upgrade
  const isRenewal =
    invoice.billing_reason === 'subscription_cycle' ||
    invoice.billing_reason === 'subscription_update';

  if (isRenewal) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
        select: { userId: true },
      });

      if (subscription) {
        const user = await prisma.user.findUnique({
          where: { id: subscription.userId },
          select: { email: true, name: true },
        });

        if (user && user.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
          const emailResult = await sendEmail({
            to: user.email,
            template: EMAIL_TEMPLATES.PAYMENT_UPDATED,
            variables: {
              userName: user.name ?? user.email ?? 'Utilisateur',
              amount: formatAmountFr(invoice.amount_paid, invoice.currency ?? 'eur'),
              nextBillingDate: formatDateFr(periodEnd),
              chatUrl: `${appUrl}/chat`,
            },
          });
          if (!emailResult.success) {
            console.error('[invoice-paid] Payment updated email error:', emailResult.error);
          }
        }
      }
    } catch (emailError) {
      Sentry.captureException(emailError, {
        tags: { context: 'payment-updated-email' },
      });
    }
  }
}
