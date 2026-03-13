import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatArea } from '@/components/chat/chat-area';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

// MEDIUM-5 fix: cache() deduplicates the Prisma call so generateMetadata and
// ConversationPage share the same DB roundtrip within the same render.
const getConversation = cache(async (conversationId: string, userId: string) => {
  return prisma.conversation.findUnique({
    where: { id: conversationId, userId, isDeleted: false },
    include: {
      specialist: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
          conversationId: true,
          userId: true,
        },
      },
    },
  });
});

export async function generateMetadata({ params }: ConversationPageProps): Promise<Metadata> {
  const { conversationId } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: 'Chat - Ultra IA' };

  const conversation = await getConversation(conversationId, session.user.id);
  const specialistName = conversation?.specialist?.name ?? 'Spécialiste';
  return {
    title: `${specialistName} - Chat - Ultra IA`,
  };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Uses cached result — no extra DB roundtrip if generateMetadata already ran
  const conversation = await getConversation(conversationId, session.user.id);

  if (!conversation) {
    notFound();
  }

  return (
    <ChatArea
      key={conversation.id}
      initialMessages={conversation.messages}
      conversationId={conversation.id}
      specialist={conversation.specialist}
    />
  );
}
