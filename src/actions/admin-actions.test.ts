/**
 * Testes unitários para admin-actions.ts
 * Requer configuração de test runner (vitest ou jest) com suporte a mocks.
 *
 * Para executar: npx vitest src/actions/admin-actions.test.ts
 * (após instalar: npm install -D vitest @vitest/coverage-v8)
 */

// Mock das dependências
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockPrisma = {
    specialist: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      count: vi.fn(),
    },
    knowledgeDocument: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { mockAuth, mockPrisma };
});

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/storage', () => ({
  saveFile: vi.fn().mockResolvedValue('/uploads/knowledge/test.pdf'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

import { createSpecialist, updateSpecialist, toggleSpecialistActive, deleteSpecialist } from './admin-actions';

const adminSession = { user: { id: 'admin-1', role: 'ADMIN' } };
const userSession = { user: { id: 'user-1', role: 'USER' } };

const validInput = {
  name: 'Expert Test',
  slug: 'expert-test',
  domain: 'Test',
  description: 'Description avec au moins 10 caractères',
  price: 990,
  accentColor: '#6366f1',
  avatarUrl: 'https://example.com/avatar.png',
  tags: [],
  quickPrompts: [],
};

describe('createSpecialist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne AUTH_REQUIRED pour utilisateur non authentifié', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createSpecialist(validInput);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_REQUIRED');
  });

  it('retourne FORBIDDEN pour utilisateur non ADMIN', async () => {
    mockAuth.mockResolvedValue(userSession);
    const result = await createSpecialist(validInput);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('retourne VALIDATION_ERROR pour input invalide', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const result = await createSpecialist({ name: 'X' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('crée un specialist avec isActive false', async () => {
    mockAuth.mockResolvedValue(adminSession);
    const created = { ...validInput, id: 'sp-1', isActive: false };
    mockPrisma.specialist.create.mockResolvedValue(created);

    const result = await createSpecialist(validInput);
    expect(result.success).toBe(true);
    expect(result.data?.isActive).toBe(false);
    expect(mockPrisma.specialist.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isActive: false }) })
    );
  });
});

describe('toggleSpecialistActive', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne AUTH_REQUIRED pour utilisateur non authentifié', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await toggleSpecialistActive('sp-1');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_REQUIRED');
  });

  it('alterne isActive de true para false', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPrisma.specialist.findUnique.mockResolvedValue({ isActive: true });
    mockPrisma.specialist.update.mockResolvedValue({ id: 'sp-1', isActive: false });

    const result = await toggleSpecialistActive('sp-1');
    expect(result.success).toBe(true);
    expect(result.data?.isActive).toBe(false);
  });

  it('retourne NOT_FOUND para specialist inexistente', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPrisma.specialist.findUnique.mockResolvedValue(null);

    const result = await toggleSpecialistActive('sp-invalid');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });
});

describe('deleteSpecialist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne NOT_FOUND para specialist inexistente', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPrisma.specialist.findUnique.mockResolvedValue(null);

    const result = await deleteSpecialist('sp-invalid');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('rejeita deleção com abonnements ativos', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPrisma.specialist.findUnique.mockResolvedValue({ id: 'sp-1' });
    mockPrisma.subscription.count.mockResolvedValue(2);

    const result = await deleteSpecialist('sp-1');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('CONFLICT');
    expect(result.error?.message).toContain('2 abonnement(s)');
  });

  it('deleta specialist sem abonnements ativos', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPrisma.specialist.findUnique.mockResolvedValue({ id: 'sp-1' });
    mockPrisma.subscription.count.mockResolvedValue(0);
    mockPrisma.specialist.delete.mockResolvedValue({ id: 'sp-1' });

    const result = await deleteSpecialist('sp-1');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('sp-1');
  });
});

describe('updateSpecialist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne FORBIDDEN para USER', async () => {
    mockAuth.mockResolvedValue(userSession);
    const result = await updateSpecialist('sp-1', { name: 'Novo Nome' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('FORBIDDEN');
  });

  it('atualiza specialist com input válido', async () => {
    mockAuth.mockResolvedValue(adminSession);
    mockPrisma.specialist.update.mockResolvedValue({ id: 'sp-1', name: 'Novo Nome' });

    const result = await updateSpecialist('sp-1', { name: 'Novo Nome' });
    expect(result.success).toBe(true);
  });
});
