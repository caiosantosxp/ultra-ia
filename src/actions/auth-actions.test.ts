/**
 * Testes unitários para auth-actions.ts — foco no fluxo de email (Story 6.2, Task 2.4)
 * Para executar: npx vitest src/actions/auth-actions.test.ts
 */

// Mocks de dependências
const { mockPrisma, mockSendEmail, mockSentry } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    passwordResetToken: {
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  }
  const mockSendEmail = vi.fn()
  const mockSentry = { captureException: vi.fn(), captureMessage: vi.fn() }
  return { mockPrisma, mockSendEmail, mockSentry }
})

vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    type: string
    constructor(type?: string) {
      super(type)
      this.type = type ?? ''
    }
  },
}))
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/auth', () => ({ signIn: vi.fn(), signOut: vi.fn() }))
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
  sendPasswordResetEmail: vi.fn(),
}))
vi.mock('@sentry/nextjs', () => mockSentry)
vi.mock('@/lib/constants', () => ({ APP_URL: 'http://localhost:3000' }))

import { register } from './auth-actions'

const validRegisterInput = {
  name: 'Jean Dupont',
  email: 'jean@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
}

describe('register — fluxo de email de boas-vindas (Story 6.2, AC #1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'hashed',
    })
    mockSendEmail.mockResolvedValue({ success: true, data: { id: 'email-1' } })
  })

  it('dispara email de boas-vindas após criação bem-sucedida', async () => {
    const result = await register(validRegisterInput)

    expect(result.success).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jean@example.com',
        template: 'welcome',
        variables: expect.objectContaining({
          userName: 'Jean Dupont',
          dashboardUrl: 'http://localhost:3000/chat',
        }),
      }),
    )
  })

  it('registro sucede mesmo quando sendEmail retorna falha (AC #1 — não bloqueia)', async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: { code: 'EMAIL_SEND_FAILED', message: 'timeout' } })

    const result = await register(validRegisterInput)

    expect(result.success).toBe(true)
    expect(mockSentry.captureMessage).toHaveBeenCalledWith(
      '[register] Welcome email failed',
      expect.objectContaining({ level: 'warning' }),
    )
  })

  it('registro sucede mesmo quando sendEmail lança exceção (AC #1 — try/catch)', async () => {
    mockSendEmail.mockRejectedValue(new Error('network error'))

    const result = await register(validRegisterInput)

    expect(result.success).toBe(true)
    expect(mockSentry.captureException).toHaveBeenCalled()
  })

  it('não dispara email se email do usuário for nulo', async () => {
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-2',
      name: 'Jean',
      email: null,
    })

    await register(validRegisterInput)

    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('retorna EMAIL_EXISTS se email já cadastrado', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'jean@example.com' })

    const result = await register(validRegisterInput)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('EMAIL_EXISTS')
    }
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
