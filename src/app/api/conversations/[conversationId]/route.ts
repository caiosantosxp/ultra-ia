import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, isDeleted: false },
    include: {
      specialist: {
        select: { id: true, name: true, avatarUrl: true, accentColor: true, slug: true },
      },
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

  // MEDIUM-2 fix: always return 404 when not found OR ownership fails — prevents IDOR enumeration
  if (!conversation || conversation.userId !== session.user.id) {
    return Response.json({ success: false, error: 'Conversation non trouvée' }, { status: 404 });
  }

  return Response.json({ success: true, data: conversation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true, isDeleted: true },
  });

  if (!conversation || conversation.userId !== session.user.id) {
    return Response.json({ success: false, error: 'Conversation non trouvée' }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { isDeleted: true },
  });

  return Response.json({ success: true });
}
