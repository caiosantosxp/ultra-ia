import { redirect } from 'next/navigation';

import { PaymentBanner } from '@/components/shared/payment-banner';
import { SubscriptionBlockedPage } from '@/components/shared/subscription-blocked';
import { auth } from '@/lib/auth';
import { checkSubscriptionAccess } from '@/lib/subscription';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // ADMIN users bypass subscription check
  if (session.user.role !== 'ADMIN') {
    const access = await checkSubscriptionAccess(session.user.id);

    if (!access.hasAccess) {
      return <SubscriptionBlockedPage status={access.status} />;
    }

    if (access.isPastDue) {
      return (
        <>
          <PaymentBanner />
          {children}
        </>
      );
    }
  }

  return <>{children}</>;
}
