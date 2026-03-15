'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ─── Guard ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session;
}

// ─── Update user profile ──────────────────────────────────────────────────────

export async function updateUser(
  userId: string,
  data: { name?: string; email?: string }
) {
  const session = await requireAdmin();

  if (!data.name && !data.email) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nenhum dado para atualizar' } };
  }

  // Check email uniqueness
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: { code: 'CONFLICT', message: 'Este email já está em uso' } };
    }

    // Block email edit if user has OAuth accounts
    const hasOAuth = await prisma.account.count({ where: { userId } });
    if (hasOAuth > 0) {
      return {
        success: false,
        error: { code: 'FORBIDDEN', message: 'Email não pode ser alterado em contas OAuth' },
      };
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    console.log(JSON.stringify({
      audit: 'admin_action', action: 'update_user',
      adminId: session.user.id, targetUserId: userId, timestamp: new Date().toISOString(),
    }));

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Falha ao atualizar usuário' } };
  }
}

// ─── Update user role ─────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: 'USER' | 'EXPERT' | 'ADMIN') {
  const session = await requireAdmin();

  // Admin cannot change own role
  if (session.user.id === userId) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Não é possível alterar o próprio role' } };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, ownedSpecialist: { select: { id: true, isActive: true } } },
  });

  if (!target) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } };
  }

  // Block downgrading EXPERT if they have an active specialist
  if (target.role === 'EXPERT' && role !== 'EXPERT' && target.ownedSpecialist?.isActive) {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Desvincule ou desative o especialista antes de alterar o role',
      },
    };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });

    console.log(JSON.stringify({
      audit: 'admin_action', action: 'update_user_role',
      adminId: session.user.id, targetUserId: userId,
      previousRole: target.role, newRole: role, timestamp: new Date().toISOString(),
    }));

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Falha ao alterar role' } };
  }
}

// ─── Soft delete user ─────────────────────────────────────────────────────────

export async function softDeleteUser(userId: string) {
  const session = await requireAdmin();

  // Cannot delete self
  if (session.user.id === userId) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Não é possível deletar a própria conta' } };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      deletedAt: true,
      ownedSpecialist: { select: { id: true, isActive: true } },
    },
  });

  if (!target) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } };
  }

  if (target.deletedAt) {
    return { success: false, error: { code: 'CONFLICT', message: 'Usuário já está inativo' } };
  }

  // Block delete if EXPERT with active specialist
  if (target.role === 'EXPERT' && target.ownedSpecialist?.isActive) {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Transfira ou desative o especialista antes de remover o usuário',
      },
    };
  }

  try {
    await prisma.$transaction([
      // Invalidate all sessions
      prisma.session.deleteMany({ where: { userId } }),
      // Soft delete
      prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
    ]);

    console.log(JSON.stringify({
      audit: 'admin_action', action: 'soft_delete_user',
      adminId: session.user.id, targetUserId: userId, timestamp: new Date().toISOString(),
    }));

    revalidatePath('/admin/users');
    return { success: true, data: { id: userId } };
  } catch {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Falha ao desativar usuário' } };
  }
}

// ─── Create user ──────────────────────────────────────────────────────────────

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'EXPERT' | 'ADMIN';
}) {
  await requireAdmin();

  if (!data.name || !data.email || !data.password) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nome, email e senha são obrigatórios' } };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) {
    return { success: false, error: { code: 'CONFLICT', message: 'Este email já está em uso' } };
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    revalidatePath('/admin/users');
    return { success: true, data: user };
  } catch {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Falha ao criar usuário' } };
  }
}
