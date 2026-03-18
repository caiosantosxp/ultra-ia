import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpertPanelSidebar } from '@/components/admin/expert-panel-sidebar';

export default async function ExpertLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect('/login');
  if (session.user.role !== 'EXPERT') redirect('/chat');

  const specialist = await prisma.specialist.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, accentColor: true },
  });

  if (!specialist) redirect('/chat');

  const lang = (await cookies()).get('LANG')?.value ?? 'fr';

  return (
    <div className="flex h-screen overflow-hidden">
      <ExpertPanelSidebar
        specialistId={specialist.id}
        specialistName={specialist.name}
        accentColor={specialist.accentColor}
        basePath="/expert"
        initialLocale={lang}
        user={session.user}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}
