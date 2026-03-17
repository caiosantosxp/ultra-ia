import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

  const leads = await prisma.lead.findMany({
    where: { specialistId: specialist.id },
    select: { email: true, name: true, status: true, leadType: true, score: true, createdAt: true },
  });

  if (leads.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const leadEmails = leads.map((l) => l.email);

  const leadUsers = await prisma.user.findMany({
    where: { email: { in: leadEmails } },
    select: { id: true, email: true },
  });

  const emailToLead = Object.fromEntries(leads.map((l) => [l.email, l]));
  const userIdToEmail = Object.fromEntries(leadUsers.map((u) => [u.id, u.email]));

  const conversations = await prisma.conversation.findMany({
    where: {
      specialistId: specialist.id,
      userId: { in: leadUsers.map((u) => u.id) },
      isDeleted: false,
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { content: true, role: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Group conversations by lead email
  const convsByEmail: Record<string, typeof conversations> = {};
  for (const conv of conversations) {
    const email = conv.userId ? userIdToEmail[conv.userId] : null;
    if (!email) continue;
    if (!convsByEmail[email]) convsByEmail[email] = [];
    convsByEmail[email].push(conv);
  }

  const result = leads
    .filter((lead) => leadUsers.some((u) => u.email === lead.email))
    .map((lead) => {
      const convs = convsByEmail[lead.email] ?? [];
      return {
        email: lead.email,
        name: lead.name,
        status: lead.status,
        leadType: lead.leadType,
        score: lead.score,
        createdAt: lead.createdAt,
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
