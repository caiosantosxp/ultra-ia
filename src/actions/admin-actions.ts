'use server';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { saveFile, deleteFile } from '@/lib/storage';
import {
  createSpecialistSchema,
  updateSpecialistSchema,
  fileUploadSchema,
} from '@/lib/validations/admin';

export async function createSpecialist(input: unknown) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const parsed = createSpecialistSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  try {
    const specialist = await prisma.specialist.create({
      data: { ...parsed.data, isActive: false },
    });
    return { success: true, data: specialist };
  } catch (error) {
    const isDuplicate =
      error instanceof Error && error.message.includes('Unique constraint');
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isDuplicate ? 'Ce slug est déjà utilisé' : "Échec de la création",
      },
    };
  }
}

export async function updateSpecialist(id: string, input: unknown) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const parsed = updateSpecialistSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  try {
    const specialist = await prisma.specialist.update({
      where: { id },
      data: parsed.data,
    });
    return { success: true, data: specialist };
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

export async function toggleSpecialistActive(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const current = await prisma.specialist.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!current) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Agent introuvable' } };
    }

    const specialist = await prisma.specialist.update({
      where: { id },
      data: { isActive: !current.isActive },
    });
    return { success: true, data: { id: specialist.id, isActive: specialist.isActive } };
  } catch {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Échec de la mise à jour du statut' },
    };
  }
}

export async function uploadKnowledgeDocument(specialistId: string, formData: FormData) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Aucun fichier fourni' },
    };
  }

  const parsed = fileUploadSchema.safeParse({
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileUrl = await saveFile(buffer, file.name);

    const doc = await prisma.knowledgeDocument.create({
      data: {
        specialistId,
        fileName: file.name,
        fileUrl,
        mimeType: file.type,
        fileSize: file.size,
      },
    });
    return { success: true, data: { id: doc.id, fileName: doc.fileName, fileUrl: doc.fileUrl } };
  } catch {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: "Échec de l'upload" },
    };
  }
}

export async function deleteKnowledgeDocument(documentId: string) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const doc = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
    if (!doc) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Document introuvable' } };
    }

    await deleteFile(doc.fileUrl);
    await prisma.knowledgeDocument.delete({ where: { id: documentId } });
    return { success: true, data: { id: documentId } };
  } catch {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Échec de la suppression' },
    };
  }
}

export async function deleteSpecialist(id: string) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  try {
    const exists = await prisma.specialist.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Agent introuvable' } };
    }

    const activeSubscriptions = await prisma.subscription.count({
      where: { specialistId: id, status: 'ACTIVE' },
    });
    if (activeSubscriptions > 0) {
      return {
        success: false,
        error: {
          code: 'CONFLICT',
          message: `Impossible de supprimer: ${activeSubscriptions} abonnement(s) actif(s)`,
        },
      };
    }

    await prisma.specialist.delete({ where: { id } });
    return { success: true, data: { id } };
  } catch {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Échec de la suppression' },
    };
  }
}
