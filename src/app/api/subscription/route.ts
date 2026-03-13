import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // H1: Select only non-sensitive fields — never expose stripeSubscriptionId/stripeCustomerId
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      createdAt: true,
      specialist: { select: { name: true, domain: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({ success: true, data: { subscription } });
}

const cancelSchema = z.object({
  action: z.literal('cancel'),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
      { status: 400 }
    );
  }

  // H3: Only ACTIVE subscriptions can be cancelled (not PAST_DUE — user should update payment first)
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'No cancellable subscription found' } },
      { status: 404 }
    );
  }

  // H2: Prisma-first order to enable rollback if Stripe fails
  // Step 1: Update Prisma (if this fails, no Stripe call — no inconsistency)
  try {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });
  } catch (dbError) {
    console.error('[subscription PATCH] DB error:', dbError);
    return Response.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to update subscription' } },
      { status: 500 }
    );
  }

  // Step 2: Update Stripe — rollback Prisma if Stripe call fails
  try {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (stripeError) {
    console.error('[subscription PATCH] Stripe failed, rolling back Prisma:', stripeError);
    await prisma.subscription
      .update({ where: { id: subscription.id }, data: { cancelAtPeriodEnd: false } })
      .catch((rbErr) => {
        console.error('[subscription PATCH] CRITICAL: Stripe failed AND DB rollback failed:', rbErr);
      });
    return Response.json(
      { success: false, error: { code: 'STRIPE_ERROR', message: 'Failed to cancel subscription' } },
      { status: 502 }
    );
  }

  // H1: Return only confirmation — no sensitive Stripe fields
  return Response.json({ success: true });
}
