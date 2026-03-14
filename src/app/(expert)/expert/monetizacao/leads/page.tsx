import { LeadsTable } from '@/components/admin/leads-table';
import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';

export default async function ExpertLeadsPage() {
  const { specialist } = await requireExpert();

  const leads = await prisma.lead.findMany({
    where: { specialistId: specialist.id },
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
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie os leads captados pelo seu agente
        </p>
      </div>
      <LeadsTable leads={leads} specialistId={specialist.id} />
    </div>
  );
}
