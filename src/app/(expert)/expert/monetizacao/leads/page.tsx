import { LeadsTable } from '@/components/admin/leads-table';
import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';

const LEAD_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  score: true,
  source: true,
  status: true,
  leadType: true,
  createdAt: true,
} as const;

export default async function ExpertLeadsPage() {
  const { specialist } = await requireExpert();

  let leads = await prisma.lead.findMany({
    where: { specialistId: specialist.id },
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: LEAD_SELECT,
  });

  // Backfill: create Lead records for users who have chatted but have no record yet
  const usersWithConversations = await prisma.user.findMany({
    where: { conversations: { some: { specialistId: specialist.id } } },
    select: { email: true, name: true },
  });

  const leadEmails = new Set(leads.map((l) => l.email));
  const missing = usersWithConversations.filter(
    (u): u is { email: string; name: string | null } =>
      u.email !== null && !leadEmails.has(u.email)
  );

  if (missing.length > 0) {
    await Promise.allSettled(
      missing.map((u) =>
        prisma.lead
          .create({ data: { email: u.email, name: u.name, specialistId: specialist.id, status: 'NEW' } })
          .catch(() => {})
      )
    );

    leads = await prisma.lead.findMany({
      where: { specialistId: specialist.id },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: LEAD_SELECT,
    });
  }

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
