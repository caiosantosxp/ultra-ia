import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { checkSubscriptionAccess } from '@/lib/subscription';

export async function requireSubscription() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
        { status: 401 }
      ),
    };
  }

  const access = await checkSubscriptionAccess(session.user.id);
  if (!access.hasAccess) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Active subscription required' },
        },
        { status: 403 }
      ),
    };
  }

  return { session, access };
}
