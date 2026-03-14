'use server';

import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations/subscription';
import { APP_URL } from '@/lib/constants';

export async function createCheckoutSession(input: unknown) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) {
    return {
      success: false as const,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    };
  }

  // 2. Validate input
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { specialistId } = parsed.data;

  // 3. Verify specialist exists
  const specialist = await prisma.specialist.findUnique({ where: { id: specialistId } });
  if (!specialist) {
    return {
      success: false as const,
      error: { code: 'NOT_FOUND', message: 'Spécialiste non trouvé' },
    };
  }

  // 4. Check existing active subscription (AC #9)
  const existingSub = await prisma.subscription.findUnique({
    where: { userId_specialistId: { userId: session.user.id!, specialistId } },
  });
  if (existingSub?.status === 'ACTIVE') {
    return { success: true as const, data: { redirectTo: '/chat' } };
  }

  // DEV BYPASS: when BYPASS_SUBSCRIPTION=true, skip Stripe and activate directly
  if (process.env.BYPASS_SUBSCRIPTION === 'true') {
    await prisma.subscription.upsert({
      where: { userId_specialistId: { userId: session.user.id!, specialistId } },
      update: { status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      create: {
        userId: session.user.id!,
        specialistId,
        stripeSubscriptionId: `dev_bypass_${Date.now()}`,
        stripeCustomerId: `dev_customer_${session.user.id}`,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { success: true as const, data: { redirectTo: '/chat' } };
  }

  // 5. Validate required env configuration
  if (!process.env.STRIPE_PRICE_ID) {
    console.error('STRIPE_PRICE_ID is not defined');
    return {
      success: false as const,
      error: { code: 'CONFIG_ERROR', message: 'Service de paiement non configuré' },
    };
  }

  try {
    // 6. Create or retrieve Stripe Customer
    let stripeCustomerId = (
      await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { stripeCustomerId: true },
      })
    )?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id! },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // 7. Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/specialist/${specialist.slug}`,
      metadata: {
        userId: session.user.id!,
        specialistId: specialist.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id!,
          specialistId: specialist.id,
        },
      },
      locale: 'fr',
      // Stripe Connect: 25% commission (FR17) — ativar quando connected accounts configurados
      // application_fee_percent: 25,
    });

    return { success: true as const, data: { checkoutUrl: checkoutSession.url } };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      success: false as const,
      error: { code: 'STRIPE_ERROR', message: 'Erreur lors de la création du paiement' },
    };
  }
}
