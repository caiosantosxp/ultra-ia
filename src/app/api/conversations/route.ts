import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const createConversationSchema = z.object({
  specialistId: z.string().min(1, 'Specialist ID is required'),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: session.user.id, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        createdAt: true,
        specialistId: true,
        specialist: {
          select: { id: true, name: true, avatarUrl: true, accentColor: true },
        },
        // HIGH-2 fix: include last message snippet for client-side content search (AC5)
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' as const },
          select: { content: true },
        },
      },
    }),
    prisma.conversation.count({
      where: { userId: session.user.id, isDeleted: false },
    }),
  ]);

  const data = conversations.map(({ messages, ...c }) => ({
    ...c,
    lastMessageSnippet: messages[0]?.content.slice(0, 100) ?? null,
  }));

  return Response.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + conversations.length < total,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const specialist = await prisma.specialist.findUnique({
    where: { id: parsed.data.specialistId },
  });
  if (!specialist) {
    return Response.json({ success: false, error: 'Spécialiste non trouvé' }, { status: 404 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      specialistId: specialist.id,
      title: 'Nouvelle conversation',
    },
  });

  return Response.json(
    {
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        specialistId: conversation.specialistId,
        createdAt: conversation.createdAt,
      },
    },
    { status: 201 },
  );
}
