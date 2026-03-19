'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  updatePlatformSettingsSchema,
  type UpdatePlatformSettingsInput,
} from '@/lib/validations/admin';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getPlatformSettings() {
  await requireAdmin();

  return prisma.platformSettings.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  });
}

export async function updatePlatformSettings(data: UpdatePlatformSettingsInput) {
  await requireAdmin();

  const parsed = updatePlatformSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: { message: parsed.error.issues[0].message } };
  }

  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...parsed.data },
      update: parsed.data,
    });

    revalidatePath('/admin/settings');
    return { success: true, data: settings };
  } catch {
    return { success: false, error: {} };
  }
}
