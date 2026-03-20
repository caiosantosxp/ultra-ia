import * as Sentry from '@sentry/nextjs'
import { Resend } from 'resend'

import { templateFunctions } from '@/lib/email-templates'
import { EMAIL_TEMPLATES, emailSchemaMap } from '@/lib/validations/email'
import type { EmailTemplate } from '@/lib/validations/email'

const resend = new Resend(process.env.RESEND_API_KEY)

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

interface SendEmailInput {
  to: string
  template: EmailTemplate
  variables: Record<string, string>
}

interface SendEmailResult {
  success: boolean
  data?: { id: string }
  error?: { code: string; message: string }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendEmail({ to, template, variables }: SendEmailInput): Promise<SendEmailResult> {
  const schema = emailSchemaMap[template]
  if (!schema) {
    return { success: false, error: { code: 'INVALID_TEMPLATE', message: `Unknown template: ${template}` } }
  }

  const parsed = schema.safeParse(variables)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
    }
  }

  const templateFn = templateFunctions[template]
  if (!templateFn) {
    return { success: false, error: { code: 'TEMPLATE_NOT_FOUND', message: `No template function for: ${template}` } }
  }

  const { subject, html } = templateFn(variables)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'ultra-ia <noreply@ultra-ia.com>',
        to,
        subject,
        html,
      })

      if (error) {
        lastError = new Error(error.message)
        if (attempt < MAX_RETRIES - 1) {
          await sleep(BASE_DELAY_MS * Math.pow(4, attempt))
          continue
        }
      }

      if (data) {
        return { success: true, data: { id: data.id } }
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(4, attempt))
        continue
      }
    }
  }

  Sentry.captureException(lastError ?? new Error('Unknown email error'), {
    tags: { context: 'send-email', template },
    extra: { to, attempts: MAX_RETRIES },
  })

  return {
    success: false,
    error: { code: 'EMAIL_SEND_FAILED', message: lastError?.message ?? 'Unknown error after retries' },
  }
}

export async function sendExpertInviteEmail(
  email: string,
  inviteUrl: string,
  specialistName: string,
  userName = 'Expert',
): Promise<void> {
  const result = await sendEmail({
    to: email,
    template: EMAIL_TEMPLATES.EXPERT_INVITE,
    variables: { userName, specialistName, inviteUrl },
  })
  if (!result.success) {
    throw new Error(`Failed to send expert invite email: ${result.error?.message}`)
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName = 'Utilisateur',
): Promise<void> {
  const result = await sendEmail({
    to: email,
    template: EMAIL_TEMPLATES.PASSWORD_RESET,
    variables: { userName, resetUrl },
  })
  if (!result.success) {
    throw new Error(`Failed to send password reset email: ${result.error?.message}`)
  }
}
