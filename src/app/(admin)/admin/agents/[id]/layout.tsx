import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ExpertPanelSidebar } from '@/components/admin/expert-panel-sidebar';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export default async function ExpertPanelLayout({ params, children }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;
  const specialist = await prisma.specialist.findUnique({
    where: { id },
    select: { id: true, name: true, domain: true, accentColor: true, isActive: true },
  });

  if (!specialist) notFound();

  return (
    <div className="-m-6 flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
      <ExpertPanelSidebar
        specialistId={specialist.id}
        specialistName={specialist.name}
        accentColor={specialist.accentColor}
        user={session.user}
      />
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}
