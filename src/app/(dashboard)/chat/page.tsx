import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MessageSquarePlus } from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/get-t';

export const metadata: Metadata = {
  title: 'Chat - Ultra IA',
};

export default async function ChatPage() {
  const t = await getT();
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Redirect to most recent active conversation if one exists (AC4)
  const lastConversation = await prisma.conversation.findFirst({
    where: { userId: session.user.id, isDeleted: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });

  if (lastConversation) {
    redirect(`/chat/${lastConversation.id}`);
  }

  // No conversations — auto-redirect to default specialist (by slug) or first available
  const defaultSlug = process.env.DEFAULT_SPECIALIST_SLUG;
  const defaultSpecialist = await prisma.specialist.findFirst({
    where: defaultSlug ? { slug: defaultSlug } : {},
    select: { id: true, firstMessage: true },
  });
  if (defaultSpecialist) {
    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        specialistId: defaultSpecialist.id,
        title: 'Nouvelle conversation',
      },
    });
    if (defaultSpecialist.firstMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          userId: null,
          content: defaultSpecialist.firstMessage,
          role: 'ASSISTANT',
        },
      });
    }
    redirect(`/chat/${conversation.id}`);
  }

  // Fallback empty state
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MessageSquarePlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{t.chatPage.noConversation}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.chatPage.noConversationDesc}</p>
      </div>
    </div>
  );
}
