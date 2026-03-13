import { z } from 'zod'

// Schema base para todas as variáveis de email
export const baseEmailVariablesSchema = z.object({
  userName: z.string().min(1),
})

// Welcome email (FR39)
export const welcomeEmailSchema = baseEmailVariablesSchema.extend({
  dashboardUrl: z.string().url(),
})

// Subscription confirmation (FR40)
export const subscriptionConfirmationSchema = baseEmailVariablesSchema.extend({
  specialistName: z.string().min(1),
  amount: z.string().min(1),
  nextBillingDate: z.string().min(1),
  chatUrl: z.string().url(),
})

// Payment failed (FR41)
export const paymentFailedSchema = baseEmailVariablesSchema.extend({
  specialistName: z.string().min(1),
  amount: z.string().min(1),
  gracePeriodEnd: z.string().min(1),
  billingUrl: z.string().url(),
})

// Payment updated/succeeded (FR42)
export const paymentUpdatedSchema = baseEmailVariablesSchema.extend({
  amount: z.string().min(1),
  nextBillingDate: z.string().min(1),
  chatUrl: z.string().url(),
})

// Password reset (FR6) — usado pela Story 2.3
export const passwordResetSchema = baseEmailVariablesSchema.extend({
  resetUrl: z.string().url(),
})

export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  SUBSCRIPTION_CONFIRMATION: 'subscription-confirmation',
  PAYMENT_FAILED: 'payment-failed',
  PAYMENT_UPDATED: 'payment-updated',
  PASSWORD_RESET: 'password-reset',
} as const

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES]

export const emailSchemaMap: Record<EmailTemplate, z.ZodSchema> = {
  [EMAIL_TEMPLATES.WELCOME]: welcomeEmailSchema,
  [EMAIL_TEMPLATES.SUBSCRIPTION_CONFIRMATION]: subscriptionConfirmationSchema,
  [EMAIL_TEMPLATES.PAYMENT_FAILED]: paymentFailedSchema,
  [EMAIL_TEMPLATES.PAYMENT_UPDATED]: paymentUpdatedSchema,
  [EMAIL_TEMPLATES.PASSWORD_RESET]: passwordResetSchema,
}
