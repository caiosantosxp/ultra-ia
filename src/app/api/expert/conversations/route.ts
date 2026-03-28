import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'EXPERT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const specialist = await prisma.specialist.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!specialist) {
    return NextResponse.json({ error: 'No specialist linked' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  let sinceDate: Date;
  let untilDate: Date | undefined;

  if (fromParam) {
    sinceDate = new Date(fromParam);
    if (toParam) {
      untilDate = new Date(toParam);
      untilDate.setHours(23, 59, 59, 999);
    }
  } else {
    const period = Math.max(1, Number(searchParams.get('period') ?? '30'));
    sinceDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
  }

  const dateFilter = untilDate
    ? { gte: sinceDate, lte: untilDate }
    : { gte: sinceDate };

  // Fetch all conversations for this specialist within period
  const conversations = await prisma.conversation.findMany({
    where: {
      specialistId: specialist.id,
      isDeleted: false,
      updatedAt: dateFilter,
      userId: { not: null },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Group by userId
  const byUserId = new Map<string, {
    user: { id: string; email: string | null; name: string | null };
    convs: typeof conversations;
  }>();

  for (const conv of conversations) {
    if (!conv.userId || !conv.user) continue;
    const uid = conv.userId;
    if (!byUserId.has(uid)) {
      byUserId.set(uid, { user: conv.user, convs: [] });
    }
    byUserId.get(uid)!.convs.push(conv);
  }

  if (byUserId.size === 0) {
    return NextResponse.json({ leads: [] });
  }

  // Enrich with lead data if available
  const userEmails = [...byUserId.values()]
    .map((v) => v.user.email)
    .filter((e): e is string => !!e);

  const leadMap = new Map<string, { status: string; leadType: string; score: number }>();

  if (userEmails.length > 0) {
    const leads = await prisma.lead.findMany({
      where: { specialistId: specialist.id, email: { in: userEmails } },
      select: { email: true, status: true, leadType: true, score: true },
    });
    for (const l of leads) {
      leadMap.set(l.email, { status: l.status, leadType: l.leadType, score: l.score });
    }
  }

  const result = [...byUserId.values()].map(({ user, convs }) => {
    const lead = user.email ? leadMap.get(user.email) : undefined;
    return {
      email: user.email ?? user.id,
      name: user.name,
      status: lead?.status ?? 'USER',
      leadType: lead?.leadType ?? 'ORGANIC',
      score: lead?.score ?? 0,
      totalMessages: convs.reduce((sum, c) => sum + c._count.messages, 0),
      conversations: convs.map((conv) => ({
        id: conv.id,
        title: conv.title,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages,
        lastMessage: conv.messages[0]
          ? { content: conv.messages[0].content.slice(0, 140), role: conv.messages[0].role }
          : null,
      })),
    };
  });

  return NextResponse.json({ leads: result });
}
