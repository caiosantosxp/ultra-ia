import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { AgentAnalyticsPanel } from '@/components/admin/agent-analytics-panel';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.admin.analyticsPage.title} — Admin` };
}

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
        const msgsPerDay = (totalMessages / period).toFixed(1);
        const avgMsgsPerConv =
          totalConversations > 0
            ? (totalMessages / totalConversations).toFixed(1)
            : '—';

        return {
          specialist,
          totalMessages,
          activeSubscribers,
          totalConversations,
          retentionRate,
          msgsPerDay,
          avgMsgsPerConv,
        };
      })
    );

    return { specialists, metricsPerSpecialist };
  },
  ['admin-comparative-metrics-v2'],
  { revalidate: 300, tags: ['analytics'] }
);

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const t = await getT();
  const ap = t.admin.analyticsPage;

  const { specialists, metricsPerSpecialist } = await getComparativeMetrics();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold">{ap.title}</h1>
      </div>

      {/* Comparative table */}
      <section aria-labelledby="comparative-heading">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {ap.comparativeTable}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {metricsPerSpecialist.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ap.noAgents}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {ap.colAgent}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {ap.colMessages}
                    <span className="ml-1 text-xs font-normal opacity-60">(30j)</span>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {ap.colMsgsPerDay}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {ap.colSubscribers}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {ap.colConversations}
                    <span className="ml-1 text-xs font-normal opacity-60">(30j)</span>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {ap.colAvgMsgs}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    {ap.colRetention}
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricsPerSpecialist
                  .sort((a, b) => b.totalMessages - a.totalMessages)
                  .map(({ specialist, totalMessages, activeSubscribers, totalConversations, retentionRate, msgsPerDay, avgMsgsPerConv }) => (
                    <tr
                      key={specialist.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: specialist.accentColor }}
                            aria-hidden="true"
                          />
                          <span className="font-medium">{specialist.name}</span>
                          {specialist.domain && (
                            <span className="text-xs text-muted-foreground">
                              {specialist.domain}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {totalMessages.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {msgsPerDay}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {activeSubscribers}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {totalConversations}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {avgMsgsPerConv}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={
                            retentionRate >= 70
                              ? 'text-green-500'
                              : retentionRate >= 40
                                ? 'text-yellow-500'
                                : 'text-red-500'
                          }
                        >
                          {retentionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Per-agent analytics panel */}
      <AgentAnalyticsPanel specialists={specialists} />
    </div>
  );
}
