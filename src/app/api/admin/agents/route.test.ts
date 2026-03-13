/**
 * Testes de integração para GET /api/admin/agents
 * Requer configuração de test runner (vitest ou jest) com suporte a mocks.
 */

const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockPrisma = {
    specialist: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  };
  return { mockAuth, mockPrisma };
});

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { NextRequest } from 'next/server';
import { GET, POST } from './route';

function makeRequest(url = 'http://localhost/api/admin/agents', init?: RequestInit) {
  return new NextRequest(url, init);
}

describe('GET /api/admin/agents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 para usuário não autenticado', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(makeRequest() as NextRequest);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('AUTH_REQUIRED');
  });

  it('retorna 403 para role USER', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'USER' } });
    const res = await GET(makeRequest() as NextRequest);
    expect(res.status).toBe(403);
  });

  it('retorna lista paginada para ADMIN', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const agents = [
      { id: 'sp-1', name: 'Agent 1', domain: 'Test', _count: { subscriptions: 0, conversations: 0 } },
    ];
    mockPrisma.specialist.findMany.mockResolvedValue(agents);
    mockPrisma.specialist.count.mockResolvedValue(1);

    const res = await GET(makeRequest('http://localhost/api/admin/agents?page=1&limit=20') as NextRequest);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toMatchObject({ page: 1, limit: 20, total: 1, hasMore: false });
  });

  it('suporta filtro por nome via search param', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockPrisma.specialist.findMany.mockResolvedValue([]);
    mockPrisma.specialist.count.mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/admin/agents?search=juridique') as NextRequest);

    expect(mockPrisma.specialist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    );
  });
});

describe('POST /api/admin/agents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 403 para role USER', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'USER' } });
    const res = await POST(
      new Request('http://localhost/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }) as NextRequest
    );
    expect(res.status).toBe(403);
  });
});
