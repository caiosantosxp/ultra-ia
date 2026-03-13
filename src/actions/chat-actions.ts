'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConversationSchema, sendMessageSchema } from '@/lib/validations/chat';

export async function createConversation(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };
  }

  const parsed = createConversationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
  }

  const specialist = await prisma.specialist.findUnique({ where: { id: parsed.data.specialistId } });
  if (!specialist) {
    return { success: false as const, error: { code: 'NOT_FOUND', message: 'Spécialiste non trouvé' } };
  }

  // MEDIUM-4 fix: set default title consistently with API route (AC11)
  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      specialistId: specialist.id,
      title: 'Nouvelle conversation',
    },
  });

  return { success: true as const, data: { conversationId: conversation.id } };
}

export async function sendMessage(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };
  }

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: parsed.data.conversationId, userId: session.user.id, isDeleted: false },
  });
  if (!conversation) {
    return { success: false as const, error: { code: 'NOT_FOUND', message: 'Conversation non trouvée' } };
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      userId: session.user.id,
      content: parsed.data.content,
      role: 'USER',
    },
  });

  // MEDIUM-3 fix: consistent 50-char truncation (AC11) — aligns with stream/route.ts
  if (!conversation.title || conversation.title === 'Nouvelle conversation') {
    const newTitle = parsed.data.content.slice(0, 50);
    if (newTitle) {
      await prisma.conversation.update({ where: { id: conversation.id }, data: { title: newTitle } });
    }
  }

  return { success: true as const, data: { message } };
}

export async function deleteConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId: session.user.id },
  });
  if (!conversation) {
    return { success: false as const, error: { code: 'NOT_FOUND', message: 'Conversation non trouvée' } };
  }

  await prisma.conversation.update({ where: { id: conversationId }, data: { isDeleted: true } });

  return { success: true as const };
}
