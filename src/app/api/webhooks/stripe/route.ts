import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { handleCheckoutCompleted } from './handlers/checkout-completed';
import { handleInvoicePaid } from './handlers/invoice-paid';
import { handleInvoicePaymentFailed } from './handlers/invoice-payment-failed';
import { handleSubscriptionUpdated } from './handlers/subscription-updated';
import { handleSubscriptionDeleted } from './handlers/subscription-deleted';

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not defined');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  // Idempotência: verificar se evento já foi processado
  const alreadyProcessed = await prisma.processedStripeEvent.findUnique({
    where: { eventId: event.id },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, event.id);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, event.id);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.id);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
        break;
      default:
        // Ignorar silenciosamente eventos desconhecidos (retornar 200 para evitar retry)
        await prisma.processedStripeEvent.create({
          data: { eventId: event.id, type: event.type },
        });
    }
  } catch (err) {
    // P2002 = unique constraint — evento já processado por request concorrente (race condition)
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error(`Error processing Stripe event ${event.type}:`, err);
    // Retornar 500 para que Stripe faça retry
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
