/**
 * NOTA DE PRIVACIDADE (AC1 — Story 4.5):
 * O campo `content` das mensagens armazena o texto digitado pelo usuário e as respostas da IA.
 * A separação de identidade é feita via `userId` (campo separado do conteúdo).
 * O usuário é responsável por não incluir dados pessoais identificáveis no conteúdo das mensagens
 * (ex: CPF, email de terceiros, número de telefone). O sistema não injeta PII no content.
 */

import * as Sentry from '@sentry/nextjs';
import type { Prisma } from '@prisma/client';
import type { Conversation, Message } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type ConversationWithMessages = Conversation & { messages: Message[] };

type Tx = Prisma.TransactionClient;

/**
 * RGPD — Opção A (padrão): Anonimizar conversas e mensagens do usuário.
 * - Define Message.userId = null (remove vínculo direto de identidade nas mensagens)
 * - Define Conversation.userId = null (separa identificação do conteúdo)
 * - Define Conversation.isDeleted = true (soft delete RGPD)
 * - Conteúdo das mensagens é retido para analytics agregados
 *
 * @param tx - Opcional: cliente de transação Prisma para atomicidade com user.delete()
 */
export async function anonymizeUserConversations(
  userId: string,
  tx?: Tx
): Promise<{ anonymized: number }> {
  const db = tx ?? prisma;

  // Anonimizar mensagens primeiro (remove vínculo direto userId → User)
  await db.message.updateMany({
    where: { userId },
    data: { userId: null },
  });

  // Anonimizar e soft-delete conversas
  const result = await db.conversation.updateMany({
    where: { userId },
    data: { userId: null, isDeleted: true },
  });

  // AC10 — Auditoria de conformidade RGPD via Sentry
  Sentry.captureMessage('User conversations anonymized', {
    level: 'info',
    extra: { userId, count: result.count, timestamp: new Date().toISOString() },
  });

  return { anonymized: result.count };
}

/**
 * RGPD — Opção B (exclusão completa): Deletar permanentemente conversas e mensagens.
 * - Deleta todas as Conversation do usuário
 * - Cascade deleta todas as Messages associadas
 * - Nenhum dado retido
 *
 * @param tx - Opcional: cliente de transação Prisma para atomicidade com user.delete()
 */
export async function deleteUserConversations(
  userId: string,
  tx?: Tx
): Promise<{ deleted: number }> {
  const db = tx ?? prisma;
  const result = await db.conversation.deleteMany({ where: { userId } });

  // AC10 — Auditoria de conformidade RGPD via Sentry
  Sentry.captureMessage('User conversations permanently deleted', {
    level: 'info',
    extra: { userId, count: result.count, timestamp: new Date().toISOString() },
  });

  return { deleted: result.count };
}

/**
 * Export RGPD: Retorna todas as conversas com mensagens do usuário.
 * Usado por GET /api/user/data-export para incluir dados de chat no pacote RGPD.
 */
export async function getUserChatData(userId: string): Promise<ConversationWithMessages[]> {
  const data = await prisma.conversation.findMany({
    where: { userId, isDeleted: false },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
  });

  // AC10 — Auditoria de acesso a dados RGPD via Sentry
  Sentry.captureMessage('User chat data accessed for RGPD export', {
    level: 'info',
    extra: { userId, conversationCount: data.length, timestamp: new Date().toISOString() },
  });

  return data;
}
