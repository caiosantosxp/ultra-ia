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

    // Daily message data for line chart
    // Note: DB columns use camelCase (Prisma default without @map on fields)
    const rawDailyData = await prisma.$queryRaw<Array<{ date: string; count: unknown }>>`
      SELECT
        DATE(m."createdAt")::text AS date,
        COUNT(m.id)::int AS count
      FROM messages m
      JOIN conversations c ON m."conversationId" = c.id
      WHERE c."specialistId" = ${specialistId}
        AND m."createdAt" >= ${startDate}
        AND c."isDeleted" = false
      GROUP BY DATE(m."createdAt")
      ORDER BY date ASC
    `;
    const dailyData = rawDailyData.map((row) => ({ date: row.date, count: Number(row.count) }));

    // Sessions by country (conversations grouped by country)
    const rawCountryData = await prisma.$queryRaw<Array<{ country: string; count: unknown }>>`
      SELECT
        COALESCE(country, 'Autre') AS country,
        COUNT(*)::int AS count
      FROM conversations
      WHERE "specialistId" = ${specialistId}
        AND "createdAt" >= ${startDate}
        AND "isDeleted" = false
      GROUP BY COALESCE(country, 'Autre')
      ORDER BY count DESC
      LIMIT 10
    `;
    const totalConvForPct = rawCountryData.reduce((s, r) => s + Number(r.count), 0) || 1;
    const countryData = rawCountryData.map((row) => ({
      country: row.country,
      count: Number(row.count),
      percentage: Math.round((Number(row.count) / totalConvForPct) * 100),
    }));

    // Activity by hour of day (messages grouped by hour)
    const rawHourlyData = await prisma.$queryRaw<Array<{ hour: unknown; count: unknown }>>`
      SELECT
        EXTRACT(HOUR FROM m."createdAt")::int AS hour,
        COUNT(m.id)::int AS count
      FROM messages m
      JOIN conversations c ON m."conversationId" = c.id
      WHERE c."specialistId" = ${specialistId}
        AND m."createdAt" >= ${startDate}
        AND c."isDeleted" = false
      GROUP BY EXTRACT(HOUR FROM m."createdAt")
      ORDER BY hour ASC
    `;
    // Fill in missing hours with 0
    const hourMap = new Map(rawHourlyData.map((r) => [Number(r.hour), Number(r.count)]));
    const hourlyData = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap.get(h) ?? 0 }));

    return {
      totalMessages,
      activeSubscribers,
      retentionRate,
      messagesPerDay,
      conversationsPerWeek,
      totalConversations,
      dailyData,
      countryData,
      hourlyData,
    };
  },
  ['agent-metrics-v2'],
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

// Platform-wide metrics for admin dashboard
const getCachedPlatformMetrics = unstable_cache(
  async (period: number): Promise<PlatformMetrics> => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - period);
    startDate.setHours(0, 0, 0, 0);

    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - period);

    const [
      activeSubscribersData,
      messagesTodayResult,
      messagesYesterdayResult,
      totalUsers,
      totalExperts,
      totalAgents,
      newUsersThisPeriod,
      newSubscriptionsThisPeriod,
      prevPeriodSubscriptions,
      totalConversationsThisPeriod,
      totalMessagesThisPeriod,
    ] = await Promise.all([
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { createdAt: true, specialist: { select: { price: true } } },
      }),
      prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: today } }),
      prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: yesterday } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: 'EXPERT', deletedAt: null } }),
      prisma.specialist.count({ where: { isActive: true } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startDate } } }),
      prisma.subscription.count({ where: { createdAt: { gte: startDate } } }),
      prisma.subscription.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } }),
      prisma.conversation.count({ where: { isDeleted: false, createdAt: { gte: startDate } } }),
      prisma.message.count({ where: { createdAt: { gte: startDate } } }),
    ]);

    const activeSubscribers = activeSubscribersData.length;
    const mrr = activeSubscribersData.reduce((sum, s) => sum + s.specialist.price, 0);
    const preExistingSubs = activeSubscribersData.filter((s) => s.createdAt < firstDayThisMonth);
    const subscribersBeforeThisMonth = preExistingSubs.length;
    const lastMonthMrr = preExistingSubs.reduce((sum, s) => sum + s.specialist.price, 0);
    const messagesToday = messagesTodayResult._sum.count ?? 0;
    const messagesYesterday = messagesYesterdayResult._sum.count ?? 0;
    const avgMessagesPerConversation =
      totalConversationsThisPeriod > 0
        ? Math.round((totalMessagesThisPeriod / totalConversationsThisPeriod) * 10) / 10
        : 0;

    const rawDailySubscriptions = await prisma.$queryRaw<Array<{ date: string; count: unknown }>>`
      SELECT DATE("createdAt")::text AS date, COUNT(*)::int AS count
      FROM subscriptions
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    const rawDailyMessages = await prisma.$queryRaw<Array<{ date: string; count: unknown }>>`
      SELECT DATE(m."createdAt")::text AS date, COUNT(m.id)::int AS count
      FROM messages m
      JOIN conversations c ON m."conversationId" = c.id
      WHERE m."createdAt" >= ${startDate}
        AND c."isDeleted" = false
      GROUP BY DATE(m."createdAt")
      ORDER BY date ASC
    `;

    return {
      activeSubscribers,
      activeSubscribersTrend: subscribersBeforeThisMonth
        ? Math.round(((activeSubscribers - subscribersBeforeThisMonth) / subscribersBeforeThisMonth) * 100)
        : 0,
      messagesToday,
      messagesTodayTrend: messagesYesterday
        ? Math.round(((messagesToday - messagesYesterday) / messagesYesterday) * 100)
        : 0,
      mrr,
      mrrTrend: lastMonthMrr ? Math.round(((mrr - lastMonthMrr) / lastMonthMrr) * 100) : 0,
      retentionRate: totalUsers > 0 ? Math.round((activeSubscribers / totalUsers) * 100) : 0,
      retentionRateTrend: 0,
      totalUsers,
      totalExperts,
      totalAgents,
      newUsersThisPeriod,
      newSubscribersThisPeriod: newSubscriptionsThisPeriod,
      newSubscribersTrend: prevPeriodSubscriptions > 0
        ? Math.round(((newSubscriptionsThisPeriod - prevPeriodSubscriptions) / prevPeriodSubscriptions) * 100)
        : 0,
      totalConversationsThisPeriod,
      totalMessagesThisPeriod,
      avgMessagesPerConversation,
      dailySubscriptions: rawDailySubscriptions.map((r) => ({ date: r.date, count: Number(r.count) })),
      dailyMessages: rawDailyMessages.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
  },
  ['admin-platform-metrics-v2'],
  { revalidate: 300, tags: ['analytics'] }
);

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');
  const specialistId = searchParams.get('specialistId') ?? null;
  const rawPeriod = parseInt(searchParams.get('period') ?? '30');
  const period = Math.min(90, Math.max(7, isNaN(rawPeriod) ? 30 : rawPeriod)) as 7 | 15 | 30 | 90;

  const isAdmin = session.user.role === 'ADMIN';
  const isExpert = session.user.role === 'EXPERT';

  // Experts may only access their own specialist's metrics
  if (!isAdmin && !isExpert) {
    return Response.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  if (isExpert && specialistId) {
    const owned = await prisma.specialist.findFirst({
      where: { id: specialistId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!owned) {
      return Response.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
    }
  }

  if (!isAdmin && !specialistId) {
    return Response.json({ success: false, error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    // Platform dashboard metrics — admin only
    if (isAdmin && type === 'platform') {
      const data = await getCachedPlatformMetrics(period);
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
