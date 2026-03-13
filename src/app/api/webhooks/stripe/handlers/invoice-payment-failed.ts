import * as Sentry from '@sentry/nextjs';
import Stripe from 'stripe';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { EMAIL_TEMPLATES } from '@/lib/validations/email';


function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmountFr(amountInCents: number | null, currency: string): string {
  if (!amountInCents) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
  // No Stripe SDK v20+, subscription ID está em invoice.parent.subscription_details.subscription
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId =
    typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef?.id;

  if (!stripeSubscriptionId) {
    // Registrar evento para evitar reprocessamento e satisfazer AC #10
    await prisma.processedStripeEvent.create({
      data: { eventId, type: 'invoice.payment_failed' },
    });
    return;
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { status: 'PAST_DUE' },
    }),
    prisma.processedStripeEvent.create({
      data: { eventId, type: 'invoice.payment_failed' },
    }),
  ]);

  // Enviar email de alerta de falha de pagamento (falha não bloqueia webhook — AC #3)
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
        // Usar next_payment_attempt do Stripe (data real de retry) ou fallback +7 dias
        const gracePeriodDate = invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const emailResult = await sendEmail({
          to: user.email!,
          template: EMAIL_TEMPLATES.PAYMENT_FAILED,
          variables: {
            userName: user.name ?? user.email ?? 'Utilisateur',
            amount: formatAmountFr(invoice.amount_due, invoice.currency ?? 'eur'),
            gracePeriodEnd: formatDateFr(gracePeriodDate),
            billingUrl: `${appUrl}/billing`,
          },
        });
        if (!emailResult.success) {
          console.error('[invoice-payment-failed] Payment failed email error:', emailResult.error);
        }
      }
    }
  } catch (emailError) {
    Sentry.captureException(emailError, {
      tags: { context: 'payment-failed-email' },
    });
  }
}
