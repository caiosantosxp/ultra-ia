import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { APP_URL } from '@/lib/constants';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ['ACTIVE', 'PAST_DUE'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription?.stripeCustomerId) {
    return Response.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'No active subscription found' } },
      { status: 404 }
    );
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${APP_URL}/billing`,
    });

    return Response.json({ success: true, data: { url: portalSession.url } });
  } catch (error) {
    console.error('[subscription/portal] Stripe error:', error);
    return Response.json(
      { success: false, error: { code: 'STRIPE_ERROR', message: 'Failed to create portal session' } },
      { status: 502 }
    );
  }
}
