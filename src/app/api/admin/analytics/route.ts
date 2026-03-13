import { unstable_cache } from 'next/cache';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PlatformMetrics } from '@/types/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cached agent-specific metrics (per specialist + period)
const getCachedAgentMetrics = unstable_cache(
  async (specialistId: string, period: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [totalMessages, activeSubscribers, totalSubscribersAllTime, totalConversations] =
      await Promise.all([
        prisma.message.count({
          where: {
            conversation: { specialistId, isDeleted: false },
            createdAt: { gte: startDate },
          },
        }),
        prisma.subscription.count({
          where: { specialistId, status: 'ACTIVE' },
        }),
        prisma.subscription.count({
          where: { specialistId },
        }),
        prisma.conversation.count({
          where: { specialistId, isDeleted: false, createdAt: { gte: startDate } },
        }),
      ]);

    const retentionRate =
      totalSubscribersAllTime > 0
        ? Math.round((activeSubscribers / totalSubscribersAllTime) * 100)
        : 0;
    const messagesPerDay = totalMessages > 0 ? (totalMessages / period).toFixed(1) : '0';
    const conversationsPerWeek =
      totalConversations > 0 ? (totalConversations / (period / 7)).toFixed(1) : '0';

    // Daily message data for line chart using $queryRaw (Prisma groupBy doesn't support DATE() truncation)
    // Note: COUNT returns bigint by default in PostgreSQL; ::int cast + Number() ensures safe JSON serialization
    const rawDailyData = await prisma.$queryRaw<Array<{ date: string; count: unknown }>>`
      SELECT
        DATE(m.created_at)::text AS date,
        COUNT(m.id)::int AS count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.specialist_id = ${specialistId}
        AND m.created_at >= ${startDate}
        AND c.is_deleted = false
      GROUP BY DATE(m.created_at)
      ORDER BY date ASC
    `;
    const dailyData = rawDailyData.map((row) => ({ date: row.date, count: Number(row.count) }));

    return {
      totalMessages,
      activeSubscribers,
      retentionRate,
      messagesPerDay,
      conversationsPerWeek,
      dailyData,
    };
  },
  ['agent-metrics'],
  {
    revalidate: 300, // 5 minutes
    tags: ['analytics'],
  }
);

// Cached comparative metrics for all active specialists
const getCachedComparativeMetrics = unstable_cache(
  async (period: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const specialists = await prisma.specialist.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, domain: true, accentColor: true },
    });

    const metricsPerSpecialist = await Promise.all(
      specialists.map(async (specialist) => {
        const [totalMessages, activeSubscribers, totalConversations] = await Promise.all([
          prisma.message.count({
            where: {
              conversation: { specialistId: specialist.id, isDeleted: false },
              createdAt: { gte: startDate },
            },
          }),
          prisma.subscription.count({
            where: { specialistId: specialist.id, status: 'ACTIVE' },
          }),
          prisma.conversation.count({
            where: { specialistId: specialist.id, isDeleted: false, createdAt: { gte: startDate } },
          }),
        ]);
        return { specialist, totalMessages, activeSubscribers, totalConversations };
      })
    );

    return { specialists: metricsPerSpecialist };
  },
  ['comparative-metrics'],
  {
    revalidate: 300,
    tags: ['analytics'],
  }
);

// Platform-wide metrics for admin dashboard (Story 5.1)
const getPlatformMetrics = unstable_cache(
  async (): Promise<PlatformMetrics> => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [activeSubscribersData, messagesTodayResult, messagesYesterdayResult, totalUsers] =
      await Promise.all([
        // Fetch active subs with specialist price and createdAt for MRR + trend in one query
        prisma.subscription.findMany({
          where: { status: 'ACTIVE' },
          select: { createdAt: true, specialist: { select: { price: true } } },
        }),
        prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: today } }),
        prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: yesterday } }),
        prisma.user.count({ where: { role: 'USER' } }),
      ]);

    const activeSubscribers = activeSubscribersData.length;
    // Real MRR: sum of each active subscriber's specialist price (in cents)
    const mrr = activeSubscribersData.reduce((sum, s) => sum + s.specialist.price, 0);

    // Trend approximation: compare current total vs subscribers that existed before this month
    const preExistingSubs = activeSubscribersData.filter((s) => s.createdAt < firstDayThisMonth);
    const subscribersBeforeThisMonth = preExistingSubs.length;
    const lastMonthMrr = preExistingSubs.reduce((sum, s) => sum + s.specialist.price, 0);

    const messagesToday = messagesTodayResult._sum.count ?? 0;
    const messagesYesterday = messagesYesterdayResult._sum.count ?? 0;

    return {
      activeSubscribers,
      activeSubscribersTrend: subscribersBeforeThisMonth
        ? Math.round(
            ((activeSubscribers - subscribersBeforeThisMonth) / subscribersBeforeThisMonth) * 100
          )
        : 0,
      messagesToday,
      messagesTodayTrend: messagesYesterday
        ? Math.round(((messagesToday - messagesYesterday) / messagesYesterday) * 100)
        : 0,
      mrr,
      mrrTrend: lastMonthMrr
        ? Math.round(((mrr - lastMonthMrr) / lastMonthMrr) * 100)
        : 0,
      retentionRate: totalUsers > 0 ? Math.round((activeSubscribers / totalUsers) * 100) : 0,
      retentionRateTrend: 0,
    };
  },
  ['admin-platform-metrics'],
  { revalidate: 300, tags: ['analytics'] }
);

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN') {
    return Response.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');
  const specialistId = searchParams.get('specialistId') ?? null;
  const rawPeriod = parseInt(searchParams.get('period') ?? '30');
  const period = Math.min(90, Math.max(7, isNaN(rawPeriod) ? 30 : rawPeriod)) as 7 | 30 | 90;

  try {
    // Platform dashboard metrics (Story 5.1)
    if (type === 'platform' || (!specialistId && !searchParams.has('period'))) {
      const data = await getPlatformMetrics();
      return Response.json({ success: true, data });
    }

    if (specialistId) {
      const metrics = await getCachedAgentMetrics(specialistId, period);
      return Response.json({ success: true, data: metrics });
    }

    const comparative = await getCachedComparativeMetrics(period);
    return Response.json({ success: true, data: comparative });
  } catch (error) {
    console.error('[analytics] Error fetching metrics:', error);
    return Response.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
