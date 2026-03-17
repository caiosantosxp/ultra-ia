'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ─── Guards ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

async function requireAdminOrOwner(specialistId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  if (session.user.role === 'ADMIN') return session;
  const specialist = await prisma.specialist.findUnique({
    where: { id: specialistId },
    select: { ownerId: true },
  });
  if (specialist?.ownerId !== session.user.id) throw new Error('Unauthorized');
  return session;
}

// ─── Lead actions ────────────────────────────────────────────────────────────

export async function updateLeadStatus(
  leadId: string,
  status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST'
) {
  await requireAdmin();
  await prisma.lead.update({ where: { id: leadId }, data: { status } });
  revalidatePath('/admin/agents', 'layout');
}

// ─── Keyword actions ─────────────────────────────────────────────────────────

export async function addKeyword(specialistId: string, name: string, weight: number) {
  await requireAdminOrOwner(specialistId);
  const keyword = await prisma.keyword.upsert({
    where: { specialistId_name: { specialistId, name } },
    update: { weight },
    create: { specialistId, name, weight },
    select: { id: true, name: true, weight: true },
  });
  revalidatePath(`/admin/agents/${specialistId}/monetizacao/leads/configuracao`);
  revalidatePath(`/expert/monetizacao/leads/configuracao`);
  return keyword;
}

export async function removeKeyword(id: string, specialistId: string) {
  await requireAdminOrOwner(specialistId);
  await prisma.keyword.delete({ where: { id } });
  revalidatePath(`/admin/agents/${specialistId}/monetizacao/leads/configuracao`);
  revalidatePath(`/expert/monetizacao/leads/configuracao`);
}

export async function updateKeywordWeight(id: string, weight: number, specialistId: string) {
  await requireAdminOrOwner(specialistId);
  await prisma.keyword.update({ where: { id }, data: { weight } });
  revalidatePath(`/admin/agents/${specialistId}/monetizacao/leads/configuracao`);
  revalidatePath(`/expert/monetizacao/leads/configuracao`);
}

// ─── Security settings actions ───────────────────────────────────────────────

export async function updateSecuritySettings(
  specialistId: string,
  settings: {
    showSources?: boolean;
    showBranding?: boolean;
    personalBranding?: boolean;
    hideSidebar?: boolean;
    requirePhone?: boolean;
  }
) {
  await requireAdminOrOwner(specialistId);
  await prisma.specialist.update({
    where: { id: specialistId },
    data: settings,
  });
  revalidatePath(`/admin/agents/${specialistId}/personalizacao`);
}

// ─── Team member actions ──────────────────────────────────────────────────────

export async function addTeamMember(
  specialistId: string,
  data: { email: string; name?: string; role?: string }
) {
  await requireAdminOrOwner(specialistId);
  await prisma.expertTeamMember.upsert({
    where: { specialistId_email: { specialistId, email: data.email } },
    update: { name: data.name, role: data.role ?? 'Admin' },
    create: {
      specialistId,
      email: data.email,
      name: data.name,
      role: data.role ?? 'Admin',
    },
  });
  revalidatePath(`/admin/agents/${specialistId}/personalizacao`);
}

export async function removeTeamMember(id: string, specialistId: string) {
  await requireAdminOrOwner(specialistId);
  await prisma.expertTeamMember.delete({ where: { id } });
  revalidatePath(`/admin/agents/${specialistId}/personalizacao`);
}
