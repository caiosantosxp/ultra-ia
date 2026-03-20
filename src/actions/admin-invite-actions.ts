'use server'

import * as Sentry from '@sentry/nextjs'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { APP_URL } from '@/lib/constants'
import { sendExpertInviteEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-helpers'

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export async function sendExpertInvite(
  specialistId: string,
  email: string,
): Promise<ActionResult<{ email: string }>> {
  const authResult = await requireAdmin()
  if ('error' in authResult) return { success: false, error: authResult.error! }

  const emailParsed = z.string().email().safeParse(email)
  if (!emailParsed.success) {
    return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email inválido' } }
  }

  const specialist = await prisma.specialist.findUnique({ where: { id: specialistId } })
  if (!specialist) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Specialist não encontrado' } }
  }

  if (specialist.ownerId) {
    return {
      success: false,
      error: { code: 'CONFLICT', message: 'Specialist já possui um expert vinculado' },
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { ownedSpecialist: true },
  })

  // F1 fix: EXPERT with a *different* specialist is a conflict; EXPERT without specialist is fine
  if (
    existingUser?.role === 'EXPERT' &&
    existingUser.ownedSpecialist !== null &&
    existingUser.ownedSpecialist.id !== specialistId
  ) {
    return {
      success: false,
      error: { code: 'CONFLICT', message: 'Este email já pertence a um expert com outro specialist' },
    }
  }

  // Invalidar tokens anteriores do mesmo specialist
  await prisma.expertInviteToken.updateMany({
    where: { specialistId, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const inviteToken = await prisma.expertInviteToken.create({
    data: { token, email, specialistId, expiresAt },
  })

  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`

  try {
    await sendExpertInviteEmail(email, inviteUrl, specialist.name, existingUser?.name ?? 'Expert')
  } catch (err) {
    // Deletar token órfão se e-mail falhar
    await prisma.expertInviteToken.delete({ where: { id: inviteToken.id } })
    Sentry.captureException(err, { tags: { context: 'send-expert-invite', specialistId } })
    return {
      success: false,
      error: { code: 'EMAIL_FAILED', message: 'Falha ao enviar e-mail de convite' },
    }
  }

  console.log(
    JSON.stringify({
      audit: 'admin_action',
      action: 'send_expert_invite',
      adminId: authResult.user.id,
      specialistId,
      email,
    }),
  )

  return { success: true, data: { email } }
}

export async function resendExpertInvite(
  specialistId: string,
): Promise<ActionResult<undefined>> {
  const authResult = await requireAdmin()
  if ('error' in authResult) return { success: false, error: authResult.error! }

  const specialist = await prisma.specialist.findUnique({ where: { id: specialistId } })
  if (!specialist) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Specialist não encontrado' } }
  }

  if (specialist.ownerId) {
    return {
      success: false,
      error: { code: 'CONFLICT', message: 'Specialist já possui um expert vinculado' },
    }
  }

  // Buscar último invite para extrair o e-mail
  const lastInvite = await prisma.expertInviteToken.findFirst({
    where: { specialistId },
    orderBy: { createdAt: 'desc' },
  })

  if (!lastInvite) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Nenhum invite anterior encontrado' },
    }
  }

  const { email } = lastInvite

  // Invalidar tokens anteriores
  await prisma.expertInviteToken.updateMany({
    where: { specialistId, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const inviteToken = await prisma.expertInviteToken.create({
    data: { token, email, specialistId, expiresAt },
  })

  const inviteUrl = `${APP_URL}/accept-invite?token=${token}`

  try {
    await sendExpertInviteEmail(email, inviteUrl, specialist.name)
  } catch (err) {
    await prisma.expertInviteToken.delete({ where: { id: inviteToken.id } })
    Sentry.captureException(err, { tags: { context: 'resend-expert-invite', specialistId } })
    return {
      success: false,
      error: { code: 'EMAIL_FAILED', message: 'Falha ao reenviar e-mail de convite' },
    }
  }

  console.log(
    JSON.stringify({
      audit: 'admin_action',
      action: 'resend_expert_invite',
      adminId: authResult.user.id,
      specialistId,
      email,
    }),
  )

  return { success: true, data: undefined }
}

export async function getSpecialistPendingInvite(specialistId: string): Promise<
  ActionResult<{
    email: string
    expiresAt: Date
    isExpired: boolean
    usedAt: Date | null
  } | null>
> {
  const authResult = await requireAdmin()
  if ('error' in authResult) return { success: false, error: authResult.error! }

  const invite = await prisma.expertInviteToken.findFirst({
    where: { specialistId },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })

  if (!invite) {
    return { success: true, data: null }
  }

  return {
    success: true,
    data: {
      email: invite.email,
      expiresAt: invite.expiresAt,
      isExpired: invite.expiresAt < new Date(),
      usedAt: invite.usedAt,
    },
  }
}

export async function acceptInviteWithPassword(
  token: string,
  name: string,
  password: string,
): Promise<ActionResult<{ isNewUser: boolean }>> {
  const inputParsed = z
    .object({
      name: z.string().min(2, 'Mínimo 2 caracteres'),
      password: z.string().min(8, 'Mínimo 8 caracteres'),
    })
    .safeParse({ name, password })

  if (!inputParsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: inputParsed.error.issues[0].message },
    }
  }

  const now = new Date()

  const inviteToken = await prisma.expertInviteToken.findUnique({ where: { token } })

  if (!inviteToken || inviteToken.expiresAt < now || inviteToken.usedAt !== null) {
    return {
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Ce lien a expiré ou a déjà été utilisé.' },
    }
  }

  const { email, specialistId } = inviteToken

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { ownedSpecialist: true },
  })

  // F1 fix: only conflict if EXPERT already has a *different* specialist
  if (
    existingUser?.role === 'EXPERT' &&
    existingUser.ownedSpecialist !== null &&
    existingUser.ownedSpecialist.id !== specialistId
  ) {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Cet email est déjà associé à un autre spécialiste.',
      },
    }
  }

  if (existingUser) {
    // Usuário existe — promover role + vincular atomicamente
    await prisma.$transaction([
      prisma.user.update({ where: { id: existingUser.id }, data: { role: 'EXPERT' } }),
      prisma.specialist.update({ where: { id: specialistId }, data: { ownerId: existingUser.id } }),
      prisma.expertInviteToken.update({ where: { token }, data: { usedAt: now } }),
    ])
    return { success: true, data: { isNewUser: false } }
  }

  // F2 fix: criar novo usuário e vincular numa única $transaction para evitar estado parcial
  const hashedPwd = await bcrypt.hash(password, 12)
  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, password: hashedPwd, role: 'EXPERT' },
    })
    await tx.specialist.update({ where: { id: specialistId }, data: { ownerId: newUser.id } })
    await tx.expertInviteToken.update({ where: { token }, data: { usedAt: now } })
  })

  return { success: true, data: { isNewUser: true } }
}

export async function acceptInviteViaOAuth(
  token: string,
  userId: string,
): Promise<ActionResult<undefined>> {
  // Verificar que o userId pertence à sessão ativa
  const session = await auth()
  if (!session?.user?.id || session.user.id !== userId) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Sessão inválida' },
    }
  }

  const now = new Date()

  const inviteToken = await prisma.expertInviteToken.findUnique({ where: { token } })

  if (!inviteToken || inviteToken.expiresAt < now || inviteToken.usedAt !== null) {
    return {
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Ce lien a expiré ou a déjà été utilisé.' },
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownedSpecialist: true },
  })

  if (!user) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } }
  }

  // F4 fix: case-insensitive email comparison
  if (user.email?.toLowerCase() !== inviteToken.email.toLowerCase()) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Ce lien ne correspond pas à votre compte connecté.' },
    }
  }

  // F1 fix: only conflict if EXPERT has a *different* specialist
  if (
    user.role === 'EXPERT' &&
    user.ownedSpecialist !== null &&
    user.ownedSpecialist.id !== inviteToken.specialistId
  ) {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Cet email est déjà associé à un autre spécialiste.',
      },
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: 'EXPERT' } }),
    prisma.specialist.update({
      where: { id: inviteToken.specialistId },
      data: { ownerId: userId },
    }),
    prisma.expertInviteToken.update({ where: { token }, data: { usedAt: now } }),
  ])

  return { success: true, data: undefined }
}
