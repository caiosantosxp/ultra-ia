import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { anonymizeUserConversations, deleteUserConversations } from '@/lib/rgpd-chat';

type DeleteType = 'anonymize' | 'delete';

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // MEDIUM-4: Validar explicitamente os valores permitidos
  const { searchParams } = new URL(request.url);
  const rawType = searchParams.get('type');
  const deleteType: DeleteType = rawType === 'delete' ? 'delete' : 'anonymize';

  try {
    // MEDIUM-1: Operação atômica — conversas e user.delete na mesma transação
    await prisma.$transaction(async (tx) => {
      // RGPD: Tratar conversas (e mensagens) antes de deletar o usuário
      if (deleteType === 'delete') {
        await deleteUserConversations(userId, tx);
      } else {
        await anonymizeUserConversations(userId, tx);
      }

      // RGPD: remover tokens de reset de senha vinculados ao email (sem relação userId no schema)
      if (userEmail) {
        await tx.passwordResetToken.deleteMany({
          where: { email: userEmail },
        });
      }

      // TODO(Epic 3): Cancelar assinaturas ativas no Stripe antes do cascade delete
      // await stripe.subscriptions.cancel(stripeSubscriptionId) para cada subscription ACTIVE

      // Deletar user — cascades: Account, Session, Subscription
      // Conversations com userId=null (anonimizadas) são preservadas via onDelete: SetNull
      // Messages com userId=null (anonimizadas) são preservadas via onDelete: SetNull
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
