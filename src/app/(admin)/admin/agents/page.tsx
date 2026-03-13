import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AgentsDataTable } from '@/components/admin/agents-data-table';
import { CreateAgentDialog } from '@/components/admin/create-agent-dialog';

export default async function AgentsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const agents = await prisma.specialist.findMany({
    include: { _count: { select: { subscriptions: true, conversations: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} enregistré{agents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreateAgentDialog />
      </div>
      <AgentsDataTable data={agents} />
    </div>
  );
}
