import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LeadsTable } from '@/components/admin/leads-table';

type Props = { params: Promise<{ id: string }> };

export default async function LeadsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/chat');

  const { id } = await params;

  const [specialistLeads, legacyLeads] = await Promise.all([
    prisma.lead.findMany({
      where: { specialistId: id },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        score: true,
        source: true,
        status: true,
        leadType: true,
        createdAt: true,
      },
    }),
    prisma.lead.findMany({
      where: { specialistId: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        score: true,
        source: true,
        status: true,
        leadType: true,
        createdAt: true,
      },
    }),
  ]);

  const allLeads = [...specialistLeads, ...legacyLeads];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os leads captados pelo seu agente
        </p>
      </div>
      <LeadsTable leads={allLeads} specialistId={id} />
    </div>
  );
}
