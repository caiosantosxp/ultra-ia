import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('generate-portal-link') }),
  z.object({ action: z.literal('extend-grace-period') }),
  z.object({ action: z.literal('cancel-subscription'), subscriptionId: z.string() }),
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (session.user.role !== 'ADMIN') {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    );
  }

  const { userId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { action } = parsed.data;

  if (action === 'generate-portal-link') {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription?.stripeCustomerId) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No active subscription with Stripe customer found',
          },
        },
        { status: 404 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/billing`,
    });

    console.log(
      JSON.stringify({
        audit: 'admin_action',
        action: 'generate-portal-link',
        adminId: session.user.id,
        targetUserId: userId,
        subscriptionId: subscription.id,
        timestamp: new Date().toISOString(),
      })
    );

    return Response.json({ success: true, data: { url: portalSession.url } });
  }

  if (action === 'extend-grace-period') {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return Response.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'No active subscription found for this user' },
        },
        { status: 404 }
      );
    }

    const currentEnd = subscription.currentPeriodEnd ?? new Date();
    const newEnd = new Date(currentEnd);
    newEnd.setDate(newEnd.getDate() + 7);

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { currentPeriodEnd: newEnd },
      select: {
        id: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    console.log(
      JSON.stringify({
        audit: 'admin_action',
        action: 'extend-grace-period',
        adminId: session.user.id,
        targetUserId: userId,
        subscriptionId: subscription.id,
        previousEnd: currentEnd.toISOString(),
        newEnd: newEnd.toISOString(),
        timestamp: new Date().toISOString(),
      })
    );

    return Response.json({ success: true, data: { subscription: updated } });
  }

  if (action === 'cancel-subscription') {
    const { subscriptionId } = parsed.data;

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: { id: true, stripeSubscriptionId: true, status: true },
    });

    if (!subscription) {
      return Response.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Assinatura não encontrada' } },
        { status: 404 }
      );
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
      return Response.json(
        { success: false, error: { code: 'CONFLICT', message: 'Assinatura não está ativa' } },
        { status: 409 }
      );
    }

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELED', cancelAtPeriodEnd: false },
    });

    console.log(JSON.stringify({
      audit: 'admin_action', action: 'cancel-subscription',
      adminId: session.user.id, targetUserId: userId,
      subscriptionId, timestamp: new Date().toISOString(),
    }));

    return Response.json({ success: true, data: { subscriptionId } });
  }

  return Response.json(
    { success: false, error: { code: 'UNKNOWN_ACTION', message: 'Unknown action' } },
    { status: 400 }
  );
}
