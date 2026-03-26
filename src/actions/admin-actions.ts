'use server';

import { Prisma } from '@/generated/prisma';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { auth as getSession } from '@/lib/auth';
import { saveFile, deleteFile } from '@/lib/storage';
import { notifyN8NKnowledgeUpload, notifyN8NKnowledgeDelete, notifyN8NAgentCreated, notifyExpertKnowledgeUpload } from '@/lib/n8n';
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

    await notifyN8NAgentCreated({
      id: specialist.id,
      name: specialist.name,
      slug: specialist.slug,
      domain: specialist.domain,
      description: specialist.description,
      price: specialist.price,
      language: specialist.language,
      isActive: specialist.isActive,
      createdAt: specialist.createdAt.toISOString(),
      webhookUrl: specialist.webhookUrl,
      systemPrompt: specialist.systemPrompt,
      scopeLimits: specialist.scopeLimits,
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
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentification requise' } };
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } };
  }
  let specialistInfo: { id: string; name: string; slug: string; domain: string } | null = null;
  if (session.user.role === 'EXPERT') {
    specialistInfo = await prisma.specialist.findFirst({
      where: { id: specialistId, ownerId: session.user.id },
      select: { id: true, name: true, slug: true, domain: true },
    });
    if (!specialistInfo) {
      return { success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } };
    }
  } else if (session.user.role === 'ADMIN') {
    specialistInfo = await prisma.specialist.findUnique({
      where: { id: specialistId },
      select: { id: true, name: true, slug: true, domain: true },
    });
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
        status: 'processing',
      },
    });

    const uploadPayload = {
      documentId: doc.id,
      specialistId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      fileBase64: buffer.toString('base64'),
    };

    await notifyN8NKnowledgeUpload(uploadPayload);

    if (specialistInfo) {
      await notifyExpertKnowledgeUpload({
        ...uploadPayload,
        agent: {
          id: specialistInfo.id,
          name: specialistInfo.name,
          slug: specialistInfo.slug,
          domain: specialistInfo.domain,
        },
      });
    }

    return { success: true, data: { id: doc.id, fileName: doc.fileName, fileUrl: doc.fileUrl, status: doc.status, createdAt: doc.createdAt } };
  } catch (err) {
    console.error('[uploadKnowledgeDocument]', err);
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: err instanceof Error ? err.message : "Échec de l'upload" },
    };
  }
}

export async function deleteKnowledgeDocument(documentId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentification requise' } };
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EXPERT') {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } };
  }

  try {
    const doc = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
    if (!doc) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Document introuvable' } };
    }
    if (session.user.role === 'EXPERT') {
      const specialist = await prisma.specialist.findFirst({
        where: { id: doc.specialistId, ownerId: session.user.id },
      });
      if (!specialist) {
        return { success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé' } };
      }
    }

    await deleteFile(doc.fileUrl);
    await prisma.knowledgeDocument.delete({ where: { id: documentId } });

    if (doc.geminiFileId) {
      await notifyN8NKnowledgeDelete({
        documentId,
        geminiFileId: doc.geminiFileId,
        specialistId: doc.specialistId,
      });
    }

    return { success: true, data: { id: documentId } };
  } catch {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Échec de la suppression' },
    };
  }
}

export async function assignSpecialistOwner(specialistId: string, userId: string | null) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return { success: false, error: auth.error };
  }

  if (userId !== null) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, ownedSpecialist: { select: { id: true } } },
    });

    if (!user) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } };
    }
    if (user.role !== 'EXPERT') {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'O usuário deve ter role EXPERT' },
      };
    }
    if (user.ownedSpecialist && user.ownedSpecialist.id !== specialistId) {
      return {
        success: false,
        error: { code: 'CONFLICT', message: 'Este usuário já é proprietário de outro especialista' },
      };
    }
  }

  try {
    const specialist = await prisma.specialist.update({
      where: { id: specialistId },
      data: { ownerId: userId },
      select: { id: true, ownerId: true },
    });
    return { success: true, data: specialist };
  } catch {
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Falha ao atualizar proprietário' },
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
