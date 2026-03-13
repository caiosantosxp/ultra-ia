import { redirect } from 'next/navigation';

import { PaymentBanner } from '@/components/shared/payment-banner';
import { SubscriptionBlockedPage } from '@/components/shared/subscription-blocked';
import { auth } from '@/lib/auth';
import { checkSubscriptionAccess } from '@/lib/subscription';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const access = await checkSubscriptionAccess(session.user.id);

  if (!access.hasAccess) {
    return <SubscriptionBlockedPage status={access.status} />;
  }

  return (
    <>
      {access.isPastDue && <PaymentBanner />}
      {children}
    </>
  );
}
