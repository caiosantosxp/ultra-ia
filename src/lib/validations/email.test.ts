/**
 * Testes unitários para schemas Zod de variáveis de email (Story 6.2 — Task 5.2)
 * Para executar: npx vitest src/lib/validations/email.test.ts
 */

import { describe, it, expect } from 'vitest'

import {
  welcomeEmailSchema,
  subscriptionConfirmationSchema,
  paymentFailedSchema,
  paymentUpdatedSchema,
  passwordResetSchema,
  emailSchemaMap,
  EMAIL_TEMPLATES,
} from './email'

describe('welcomeEmailSchema', () => {
  it('valida variáveis corretas', () => {
    const result = welcomeEmailSchema.safeParse({
      userName: 'Jean Dupont',
      dashboardUrl: 'https://ultra-ia.com/chat',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita userName vazio', () => {
    const result = welcomeEmailSchema.safeParse({
      userName: '',
      dashboardUrl: 'https://ultra-ia.com/chat',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita dashboardUrl inválida', () => {
    const result = welcomeEmailSchema.safeParse({
      userName: 'Jean',
      dashboardUrl: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita campos ausentes', () => {
    const result = welcomeEmailSchema.safeParse({ userName: 'Jean' })
    expect(result.success).toBe(false)
  })
})

describe('subscriptionConfirmationSchema', () => {
  const valid = {
    userName: 'Jean',
    specialistName: 'Expert Fiscal',
    amount: '29,99 €',
    nextBillingDate: '10 avril 2026',
    chatUrl: 'https://ultra-ia.com/chat',
  }

  it('valida variáveis corretas', () => {
    expect(subscriptionConfirmationSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita specialistName vazio', () => {
    expect(subscriptionConfirmationSchema.safeParse({ ...valid, specialistName: '' }).success).toBe(false)
  })

  it('rejeita amount vazio', () => {
    expect(subscriptionConfirmationSchema.safeParse({ ...valid, amount: '' }).success).toBe(false)
  })

  it('rejeita chatUrl inválida', () => {
    expect(subscriptionConfirmationSchema.safeParse({ ...valid, chatUrl: '/chat' }).success).toBe(false)
  })
})

describe('paymentFailedSchema', () => {
  const valid = {
    userName: 'Jean',
    specialistName: 'Expert Fiscal',
    amount: '29,99 €',
    gracePeriodEnd: '17 mars 2026',
    billingUrl: 'https://ultra-ia.com/billing',
  }

  it('valida variáveis corretas', () => {
    expect(paymentFailedSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita gracePeriodEnd vazio', () => {
    expect(paymentFailedSchema.safeParse({ ...valid, gracePeriodEnd: '' }).success).toBe(false)
  })

  it('rejeita billingUrl relativa', () => {
    expect(paymentFailedSchema.safeParse({ ...valid, billingUrl: '/billing' }).success).toBe(false)
  })
})

describe('paymentUpdatedSchema', () => {
  const valid = {
    userName: 'Jean',
    amount: '29,99 €',
    nextBillingDate: '10 avril 2026',
    chatUrl: 'https://ultra-ia.com/chat',
  }

  it('valida variáveis corretas', () => {
    expect(paymentUpdatedSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita nextBillingDate vazio', () => {
    expect(paymentUpdatedSchema.safeParse({ ...valid, nextBillingDate: '' }).success).toBe(false)
  })
})

describe('passwordResetSchema', () => {
  it('valida variáveis corretas', () => {
    const result = passwordResetSchema.safeParse({
      userName: 'Jean',
      resetUrl: 'https://ultra-ia.com/reset-password?token=abc123',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita resetUrl inválida', () => {
    expect(passwordResetSchema.safeParse({ userName: 'Jean', resetUrl: 'abc' }).success).toBe(false)
  })
})

describe('emailSchemaMap', () => {
  it('contém schema para todos os templates', () => {
    for (const template of Object.values(EMAIL_TEMPLATES)) {
      expect(emailSchemaMap[template]).toBeDefined()
    }
  })

  it('schema welcome rejeita input inválido via map', () => {
    const schema = emailSchemaMap[EMAIL_TEMPLATES.WELCOME]
    expect(schema.safeParse({ userName: '', dashboardUrl: 'bad' }).success).toBe(false)
  })
})
