import { ArrowRight, BookOpen, Share2 } from 'lucide-react';
import Link from 'next/link';

import { prisma } from '@/lib/prisma';
import { requireExpert } from '@/lib/expert-helpers';
import { getT } from '@/lib/i18n/get-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExpertSubscriptionsChart } from '@/components/admin/expert-subscriptions-chart';

const MESSAGE_LIMIT = 30_000;

export default async function ExpertDashboardPage() {
  const { specialist } = await requireExpert();
  const t = await getT();
  const id = specialist.id;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    fullSpecialist,
    messagesThisMonth,
    totalConversations,
    totalMessages,
    uniqueUsersResult,
    newSubsData,
    knowledgeDocsCount,
  ] = await Promise.all([
    prisma.specialist.findUnique({
      where: { id },
      select: { id: true, name: true, avatarUrl: true, accentColor: true, isActive: true },
    }),
    prisma.message.count({
      where: { conversation: { specialistId: id, isDeleted: false }, createdAt: { gte: firstDayOfMonth } },
    }),
    prisma.conversation.count({ where: { specialistId: id, isDeleted: false } }),
    prisma.message.count({ where: { conversation: { specialistId: id, isDeleted: false } } }),
    prisma.conversation.findMany({
      where: { specialistId: id, isDeleted: false, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.subscription.findMany({
      where: { specialistId: id, createdAt: { gte: ninetyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.knowledgeDocument.count({ where: { specialistId: id } }),
  ]);

  if (!fullSpecialist) return null;

  const uniqueUsers = uniqueUsersResult.length;
  const usagePct = Math.min(100, Math.round((messagesThisMonth / MESSAGE_LIMIT) * 100));

  const subsChartData = newSubsData.reduce<Array<{ date: string; count: number }>>(
    (acc, sub) => {
      const day = sub.createdAt.toISOString().split('T')[0];
      const last = acc[acc.length - 1];
      if (last?.date === day) { last.count += 1; }
      else { acc.push({ date: day, count: (last?.count ?? 0) + 1 }); }
      return acc;
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold font-heading">
          {t.admin.agentDashboard.welcome} {fullSpecialist.name}&nbsp;!
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            {fullSpecialist.isActive ? t.admin.agentDashboard.aiPublic : t.admin.agentDashboard.aiPrivate}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            {t.admin.agentDashboard.share}
          </Button>
          <Button size="sm" className="gap-1.5" style={{ backgroundColor: fullSpecialist.accentColor }}>
            {t.admin.agentDashboard.yourClone} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Two-column */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          {/* Utilisation */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.admin.agentDashboard.yourUsage}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.admin.agentDashboard.messagesThisMonth}</span>
                <Badge variant="outline" className="text-xs" style={{ color: usagePct > 80 ? '#dc2626' : '#16a34a', borderColor: 'currentColor' }}>
                  {usagePct}%
                </Badge>
              </div>
              <div className="flex items-baseline gap-1.5 text-sm text-muted-foreground">
                <span className="text-xl font-bold text-foreground">{messagesThisMonth.toLocaleString(t.dateLocale)}</span>
                <span>/ {MESSAGE_LIMIT.toLocaleString(t.dateLocale)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usagePct}%` }} />
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.admin.agentDashboard.yourStats}</p>
            <div className="divide-y">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{t.admin.agentDashboard.conversations}</span>
                <span className="text-sm font-semibold">{totalConversations.toLocaleString(t.dateLocale)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{t.admin.agentDashboard.messagesExchanged}</span>
                <span className="text-sm font-semibold">{totalMessages.toLocaleString(t.dateLocale)}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{t.admin.agentDashboard.uniqueUsers}</span>
                <span className="text-sm font-semibold">{uniqueUsers.toLocaleString(t.dateLocale)}</span>
              </div>
            </div>
          </div>

          {/* Revenus chart */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.admin.agentDashboard.revenue}</p>
                <p className="mt-0.5 text-sm font-medium">{t.admin.agentDashboard.newSubscriptions}</p>
                <p className="text-xs text-muted-foreground">{t.admin.agentDashboard.last90Days}</p>
              </div>
              <Link href="/expert/monetizacao/rendas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                {t.admin.agentDashboard.seeAll} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ExpertSubscriptionsChart data={subsChartData} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border bg-card">
            {fullSpecialist.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fullSpecialist.avatarUrl} alt={fullSpecialist.name} className="h-72 w-full object-cover object-top" />
            ) : (
              <div className="flex h-72 w-full items-center justify-center text-5xl font-bold text-white" style={{ backgroundColor: fullSpecialist.accentColor }}>
                {fullSpecialist.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-white backdrop-blur-sm">
                <span className="flex-1 text-xs font-medium">{t.admin.agentDashboard.insights}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">1</span>
              </div>
            </div>
          </div>

          <Link href="/expert/identidade/treinamento" className="flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{knowledgeDocsCount} {t.admin.agentDashboard.trainedResources}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
