import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch active subscription + specialist for sidebar header info
  // Conversations are fetched client-side via SWR in ConversationSidebar (AC6, AC12)
  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' },
    include: {
      specialist: {
        select: { id: true, name: true, avatarUrl: true, domain: true },
      },
    },
  });

  const specialist = subscription?.specialist ?? null;

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <ConversationSidebar
        specialistId={specialist?.id}
        specialistName={specialist?.name}
        specialistAvatarUrl={specialist?.avatarUrl ?? undefined}
        specialistDomain={specialist?.domain ?? undefined}
        user={user}
      />

      <SidebarInset className="overflow-hidden">
        {/* Dashboard Header */}
        <header className="flex h-14 shrink-0 items-center border-b bg-background px-4">
          <Link href="/" className="font-heading text-sm font-semibold text-primary hover:opacity-80 transition-opacity">ultra-ia</Link>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
