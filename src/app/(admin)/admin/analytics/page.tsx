import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

import { AgentAnalyticsPanel } from '@/components/admin/agent-analytics-panel';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Analytics — Admin',
};

const getComparativeMetrics = unstable_cache(
  async () => {
    const period = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const specialists = await prisma.specialist.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, domain: true, accentColor: true },
    });

    const metricsPerSpecialist = await Promise.all(
      specialists.map(async (specialist) => {
        const [totalMessages, activeSubscribers, totalSubscribersAllTime, totalConversations] =
          await Promise.all([
            prisma.message.count({
              where: {
                conversation: { specialistId: specialist.id, isDeleted: false },
                createdAt: { gte: startDate },
              },
            }),
            prisma.subscription.count({
              where: { specialistId: specialist.id, status: 'ACTIVE' },
            }),
            prisma.subscription.count({
              where: { specialistId: specialist.id },
            }),
            prisma.conversation.count({
              where: {
                specialistId: specialist.id,
                isDeleted: false,
                createdAt: { gte: startDate },
              },
            }),
          ]);
        const retentionRate =
          totalSubscribersAllTime > 0
            ? Math.round((activeSubscribers / totalSubscribersAllTime) * 100)
            : 0;
        return { specialist, totalMessages, activeSubscribers, totalConversations, retentionRate };
      })
    );

    return { specialists, metricsPerSpecialist };
  },
  ['admin-comparative-metrics'],
  { revalidate: 300, tags: ['analytics'] }
);

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const { specialists, metricsPerSpecialist } = await getComparativeMetrics();

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Analytics</h1>

      {/* Comparative table */}
      <section aria-labelledby="comparative-heading" className="mb-8">
        <h2 id="comparative-heading" className="mb-4 text-lg font-semibold">
          Tabela comparativa
        </h2>

        {metricsPerSpecialist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agente ativo encontrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agente</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Msgs (30d)
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Assinantes
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Conversas (30d)
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Retenção
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricsPerSpecialist.map(
                  ({
                    specialist,
                    totalMessages,
                    activeSubscribers,
                    totalConversations,
                    retentionRate,
                  }) => (
                    <tr key={specialist.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: specialist.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-medium">{specialist.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {totalMessages.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{activeSubscribers}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{totalConversations}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{retentionRate}%</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per-agent analytics panel */}
      <AgentAnalyticsPanel specialists={specialists} />
    </main>
  );
}
