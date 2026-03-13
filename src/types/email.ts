import type { z } from 'zod'

import type {
  welcomeEmailSchema,
  subscriptionConfirmationSchema,
  paymentFailedSchema,
  paymentUpdatedSchema,
  passwordResetSchema,
} from '@/lib/validations/email'

export type WelcomeEmailVariables = z.infer<typeof welcomeEmailSchema>
export type SubscriptionConfirmationVariables = z.infer<typeof subscriptionConfirmationSchema>
export type PaymentFailedVariables = z.infer<typeof paymentFailedSchema>
export type PaymentUpdatedVariables = z.infer<typeof paymentUpdatedSchema>
export type PasswordResetVariables = z.infer<typeof passwordResetSchema>

export type EmailVariables =
  | WelcomeEmailVariables
  | SubscriptionConfirmationVariables
  | PaymentFailedVariables
  | PaymentUpdatedVariables
  | PasswordResetVariables
