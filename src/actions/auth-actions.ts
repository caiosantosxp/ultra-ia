'use server';

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AuthError } from 'next-auth';

import * as Sentry from '@sentry/nextjs';

import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';
import { prisma } from '@/lib/prisma';
import { signIn, signOut } from '@/lib/auth';
import { sendEmail, sendPasswordResetEmail } from '@/lib/email';
import { EMAIL_TEMPLATES } from '@/lib/validations/email';
import { APP_URL } from '@/lib/constants';

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
  }

  const { email, password } = parsed.data;

  try {
    await signIn('credentials', { email, password, redirect: false });
    const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    const redirectTo = user?.role === 'ADMIN' ? '/admin/dashboard' : '/chat';
    return { success: true as const, data: { redirectTo } };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false as const, error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' } };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}

export async function register(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      success: false as const,
      error: { code: 'EMAIL_EXISTS', message: 'Cet email est déjà utilisé' },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let newUser: Awaited<ReturnType<typeof prisma.user.create>>;
  try {
    newUser = await prisma.user.create({ data: { name, email, password: hashedPassword } });
  } catch (e: unknown) {
    const isPrismaUniqueError =
      typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002';
    if (isPrismaUniqueError) {
      return {
        success: false as const,
        error: { code: 'EMAIL_EXISTS', message: 'Cet email est déjà utilisé' },
      };
    }
    throw e;
  }

  // Enviar email de boas-vindas — falha NÃO bloqueia o registro (AC #1, Task 2.3)
  if (newUser.email) {
    try {
      const emailResult = await sendEmail({
        to: newUser.email,
        template: EMAIL_TEMPLATES.WELCOME,
        variables: {
          userName: newUser.name ?? newUser.email,
          dashboardUrl: `${APP_URL}/chat`,
        },
      });
      if (!emailResult.success) {
        Sentry.captureMessage('[register] Welcome email failed', {
          level: 'warning',
          tags: { context: 'welcome-email', userId: newUser.id },
          extra: { error: emailResult.error },
        });
      }
    } catch (emailError) {
      Sentry.captureException(emailError, {
        tags: { context: 'welcome-email', userId: newUser.id },
      });
    }
  }

  return { success: true as const };
}

export async function requestPasswordReset(input: unknown) {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
  }

  const { email } = parsed.data;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.password) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Atomic: rate limit check + token creation to prevent race conditions
    const created = await prisma.$transaction(async (tx) => {
      const recentTokens = await tx.passwordResetToken.count({
        where: { email, createdAt: { gte: oneHourAgo }, usedAt: null },
      });
      if (recentTokens >= 3) return null;
      return tx.passwordResetToken.create({ data: { token, email, expiresAt } });
    });

    if (created) {
      const resetUrl = `${APP_URL}/reset-password?token=${token}`;
      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch {
        // Email failed — delete the token so it doesn't waste rate limit quota
        await prisma.passwordResetToken.delete({ where: { token } });
      }
    }
  }

  // Always return success to avoid revealing whether email exists
  return { success: true as const, data: { message: 'email_sent' } };
}

export async function resetPassword(input: unknown) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
  }

  const { token, password } = parsed.data;
  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.expiresAt < now || resetToken.usedAt !== null) {
    return {
      success: false as const,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Ce lien a expiré. Veuillez demander un nouveau lien.',
      },
    };
  }

  const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
  if (!user) {
    return {
      success: false as const,
      error: { code: 'INVALID_TOKEN', message: 'Ce lien a expiré. Veuillez demander un nouveau lien.' },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Update password + invalidate token + delete all active sessions in one transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: now },
    }),
    prisma.session.deleteMany({
      where: { userId: user.id },
    }),
  ]);

  return { success: true as const, data: { message: 'password_updated' } };
}
