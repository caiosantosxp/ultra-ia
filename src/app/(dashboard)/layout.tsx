import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { UserMenu } from '@/components/shared/user-menu';

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

  return (
    <SidebarProvider>
      {specialist && (
        <ConversationSidebar
          specialistId={specialist.id}
          specialistName={specialist.name}
          specialistAvatarUrl={specialist.avatarUrl}
          specialistDomain={specialist.domain}
        />
      )}

      <SidebarInset>
        {/* Dashboard Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            {specialist && <SidebarTrigger aria-label="Basculer la barre latérale" />}
            <span className="font-heading text-sm font-semibold text-primary">ultra-ia</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={session.user} />
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
