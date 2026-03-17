import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, specialistId: specialist.id, isDeleted: false },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      messages: conversation.messages,
    },
  });
}
