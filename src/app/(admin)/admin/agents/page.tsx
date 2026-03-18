import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AgentsDataTable } from '@/components/admin/agents-data-table';
import { CreateAgentDialog } from '@/components/admin/create-agent-dialog';
import { getT } from '@/lib/i18n/get-t';

export default async function AgentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const t = await getT();

  const agents = await prisma.specialist.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
      slug: true,
      price: true,
      isActive: true,
      accentColor: true,
      avatarUrl: true,
      createdAt: true,
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { subscriptions: true, conversations: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">{t.admin.agentsPage.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agents.length} {t.admin.agentsPage.total}
          </p>
        </div>
        <CreateAgentDialog />
      </div>
      <AgentsDataTable data={agents} />
    </div>
  );
}
