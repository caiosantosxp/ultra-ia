import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  const userEmail = session.user.email;

  try {
    await prisma.$transaction(async (tx) => {
      // Soft-delete todas as conversas do usuário antes do cascade (para consistência de analytics)
      await tx.conversation.updateMany({
        where: { userId },
        data: { isDeleted: true },
      });

      // RGPD: remover tokens de reset de senha vinculados ao email (sem relação userId no schema)
      if (userEmail) {
        await tx.passwordResetToken.deleteMany({
          where: { email: userEmail },
        });
      }

      // TODO(Epic 3): Cancelar assinaturas ativas no Stripe antes do cascade delete
      // await stripe.subscriptions.cancel(stripeSubscriptionId) para cada subscription ACTIVE

      // Deletar user — cascades: Account, Session, Subscription, Message, Conversation
      await tx.user.delete({
        where: { id: userId },
      });
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[data-delete] Error:', error);
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Account deletion failed' } },
      { status: 500 }
    );
  }
}
