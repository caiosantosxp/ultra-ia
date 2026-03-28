'use server';

import { Prisma } from '@/generated/prisma';
import { requireExpert } from '@/lib/expert-helpers';
import { prisma } from '@/lib/prisma';
import { updateSpecialistSchema } from '@/lib/validations/admin';

export async function updateExpertSpecialist(id: string, input: unknown) {
  const { specialist } = await requireExpert();

  if (specialist.id !== id) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Action non autorisée' } };
  }

  const parsed = updateSpecialistSchema.omit({ webhookUrl: true }).safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  try {
    const updated = await prisma.specialist.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Agent introuvable' } };
    }
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Échec de la mise à jour' },
    };
  }
}
