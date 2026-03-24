'use server';

import { Prisma } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { anonymizeUserConversations, deleteUserConversations } from '@/lib/rgpd-chat';
import { updateProfileSchema } from '@/lib/validations/profile';

export async function updateProfile(input: unknown) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };
  }

  // 2. Validate input
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { name, email } = parsed.data;

  // 3. If email is changing, verify user is not OAuth (OAuth emails are provider-managed)
  if (email !== session.user.email) {
    const oauthAccount = await prisma.account.findFirst({
      where: { userId: session.user.id, NOT: { provider: 'credentials' } },
    });
    if (oauthAccount) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Email géré par votre provider OAuth — non modifiable' },
      };
    }
  }

  // 4. Update — P2002 unique constraint handles concurrent email conflicts atomically
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, email },
    });
    revalidatePath('/settings');
    return { success: true, data: { message: 'Profil mis à jour avec succès' } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Cet email est déjà utilisé' },
      };
    }
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour du profil' },
    };
  }
}

/**
 * RGPD: Deletar conta do usuário com opção de anonimização ou exclusão completa.
 * - 'anonymize' (padrão): conversas e mensagens têm userId definido como null (retém conteúdo para analytics)
 * - 'delete': conversas e mensagens são deletadas permanentemente
 * Chamado como Server Action a partir da UI de configurações de conta.
 */
export async function deleteAccount(deleteType: 'anonymize' | 'delete' = 'anonymize') {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  try {
    // MEDIUM-1: Operação atômica — conversas e user.delete na mesma transação
    await prisma.$transaction(async (tx) => {
      // AC4: Suporte a exclusão completa (não apenas anonimização)
      if (deleteType === 'delete') {
        await deleteUserConversations(userId, tx);
      } else {
        await anonymizeUserConversations(userId, tx);
      }

      if (userEmail) {
        await tx.passwordResetToken.deleteMany({ where: { email: userEmail } });
      }
      // Deletar user — cascades: Account, Session, Subscription
      // Conversations/Messages com userId=null (anonimizadas) são preservadas via onDelete: SetNull
      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true, data: { message: 'Conta excluída com sucesso' } };
  } catch (error) {
    console.error('[deleteAccount] Error:', error);
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erro ao excluir conta' } };
  }
}
