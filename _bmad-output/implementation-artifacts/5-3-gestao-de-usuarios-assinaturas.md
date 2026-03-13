# Story 5.3: Gestão de Usuários & Assinaturas (Admin)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **admin**,
I want **to view and manage platform users and their subscriptions**,
so that **I can provide support and resolve account issues**.

## Acceptance Criteria

1. **Given** um admin acessa `/admin/users` **When** a lista carrega **Then** os usuários são exibidos em tabela paginada (limit 20) com: nome, email, data de criação, status da assinatura (FR35)

2. **And** busca por nome ou email funciona com filtragem em tempo real (debounced, via SWR)

3. **Given** um admin clica em um usuário **When** os detalhes são exibidos em `/admin/users/[userId]` **Then** mostra: informações do perfil, histórico de assinaturas, status do pagamento, e contagem de mensagens do usuário (FR36)

4. **Given** um admin identifica problema de pagamento **When** acessa os detalhes de assinatura do usuário **Then** pode visualizar o status Stripe (ACTIVE, PAST_DUE, CANCELED) **And** pode tomar ações corretivas: gerar link do portal de pagamento para o usuário e estender o período de graça (FR37)

5. **And** a ação "Gerar link de pagamento" cria uma sessão do Stripe Customer Portal para o usuário (via `stripeCustomerId`) e retorna a URL para o admin copiar/partilhar

6. **And** a ação "Estender período de graça" incrementa `currentPeriodEnd` em 7 dias no Prisma (sem alterar Stripe diretamente — ajuste local para suporte)

7. **And** API `/api/admin/conversations` (criada na Story 5.1) pode ser usada pelo painel de detalhes para listar conversas de qualquer usuário

8. **And** paginação na tabela de usuários: `GET /api/admin/users?search=&page=1&limit=20` retorna `{ data, pagination: { page, limit, total, hasMore } }`

9. **And** todas as APIs `/api/admin/*` verificam `session.user.role === 'ADMIN'` — retornam 403 FORBIDDEN se role diferente

## Tasks / Subtasks

- [x] Task 1: Criar API Route — Listar/Buscar Usuários (AC: #1, #2, #8, #9)
  - [x] 1.1 Criar `src/app/api/admin/users/route.ts`:
    ```typescript
    import { auth } from '@/lib/auth';
    import { prisma } from '@/lib/prisma';

    export async function GET(request: Request) {
      const session = await auth();
      if (!session?.user?.id) {
        return Response.json(
          { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
          { status: 401 }
        );
      }
      if (session.user.role !== 'ADMIN') {
        return Response.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search') ?? '';
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
      const limit = 20;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return Response.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      });
    }
    ```

- [x] Task 2: Criar API Route — Detalhes de Usuário (AC: #3, #4, #5, #6, #9)
  - [x] 2.1 Criar `src/app/api/admin/users/[userId]/route.ts` com handler `GET`:
    - Verificar auth + role ADMIN
    - Buscar user completo com subscriptions, contagem de mensagens, contagem de conversas:
      ```typescript
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            include: { specialist: { select: { name: true, domain: true } } },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              messages: true,
              conversations: true,
            },
          },
        },
      });
      if (!user) return Response.json({ ... }, { status: 404 });
      return Response.json({ success: true, data: user });
      ```
    - **Não expor**: `password` (hash) — usar `select` explícito para excluir campos sensíveis

  - [x] 2.2 Criar `src/app/api/admin/users/[userId]/actions/route.ts` com handler `POST`:
    - Verificar auth + role ADMIN
    - Usar Zod para validar `{ action: 'generate-portal-link' | 'extend-grace-period' }`:
      ```typescript
      const actionSchema = z.object({
        action: z.enum(['generate-portal-link', 'extend-grace-period']),
      });
      ```
    - **Ação `generate-portal-link`**:
      ```typescript
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        orderBy: { createdAt: 'desc' },
      });
      if (!subscription?.stripeCustomerId) {
        return Response.json({ success: false, error: { code: 'NOT_FOUND', ... } }, { status: 404 });
      }
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${process.env.NEXTAUTH_URL}/billing`,
      });
      return Response.json({ success: true, data: { url: portalSession.url } });
      ```
    - **Ação `extend-grace-period`**:
      ```typescript
      const subscription = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        orderBy: { createdAt: 'desc' },
      });
      if (!subscription) return Response.json({ ... }, { status: 404 });
      const currentEnd = subscription.currentPeriodEnd ?? new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + 7); // +7 dias
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { currentPeriodEnd: newEnd },
      });
      return Response.json({ success: true, data: { subscription: updated } });
      ```

- [x] Task 3: Criar componente UsersTable (AC: #1, #2)
  - [x] 3.1 Criar `src/components/admin/users-table.tsx` como Client Component (`'use client'`):
    - Import: `useState`, `useCallback`, SWR `useSWR`, Input, Table components, Badge, Skeleton, Button
    - Estado: `search: string`, `page: number`
    - SWR hook com debounce de 300ms:
      ```typescript
      const [debouncedSearch, setDebouncedSearch] = useState('');
      // Debounce effect: 300ms delay antes de atualizar debouncedSearch
      const { data, isLoading } = useSWR(
        `/api/admin/users?search=${debouncedSearch}&page=${page}&limit=20`,
        (url) => fetch(url).then(r => r.json())
      );
      ```
    - **Colunas da tabela** (ShadCN Table):
      | Nome | Email | Criado em | Status Assinatura | Ações |
      |---|---|---|---|---|
      | "Jean Dupont" | jean@email.com | "10 mars 2026" | Badge: "Actif" | [Ver detalhes] |
    - Status badges com cores (reutilizar padrão da Story 3.4):
      - `ACTIVE` → Badge verde "Ativo"
      - `PAST_DUE` → Badge laranja "Pagamento falhou"
      - `CANCELED` → Badge cinza "Cancelado"
      - `null/undefined` → Badge cinza "Sem assinatura"
    - Skeleton loading: substituir linhas da tabela por `<Skeleton />` durante `isLoading`
    - Paginação: botões "← Anterior" / "Próxima →" + "Página X de Y"
    - Link para detalhes: `href="/admin/users/${user.id}"`

  - [x] 3.2 Layout do UsersTable: campo de busca + tabela + paginação implementados

- [x] Task 4: Criar página de listagem de usuários (AC: #1, #2)
  - [x] 4.1 Criar `src/app/(admin)/users/page.tsx` como Server Component com verificação ADMIN + renderização de `<UsersTable />`

- [x] Task 5: Criar componente UserDetail e página de detalhes (AC: #3, #4, #5, #6)
  - [x] 5.1 Criar `src/app/(admin)/users/[userId]/page.tsx` como Server Component com busca Prisma direta + verificação ADMIN
  - [x] 5.2 Criar `src/components/admin/user-detail-card.tsx` como Client Component com `handleGeneratePortalLink()` e `handleExtendGracePeriod()`

- [x] Task 6: Verificar integração com API de conversas admin (AC: #7)
  - [x] 6.1 Criar `src/app/api/admin/conversations/route.ts` com suporte a `?userId=` filter, paginação, e proteção ADMIN
  - [x] 6.2 Dados de conversas disponíveis via API para uso futuro pelo painel de detalhes

- [x] Task 7: Atualizar Admin Sidebar para incluir link "Usuários" (AC: #1)
  - [x] 7.1 Criar `src/components/admin/admin-sidebar.tsx` com itens: Dashboard, Agentes, Usuários, Analytics, Config — incluindo suporte mobile (Sheet drawer)

- [x] Task 8: Validação final (AC: todos)
  - [x] 8.1 `npm run lint` sem erros (apenas warning pré-existente de Story 5.2)
  - [x] 8.2 `npx tsc --noEmit` sem erros nos arquivos da Story 5.3
  - [x] 8.3 Testar `/admin/users`: tabela carrega com dados corretos
  - [x] 8.4 Testar busca: digitar nome/email → tabela filtra com debounce
  - [x] 8.5 Testar paginação: botões Anterior/Próxima funcionam
  - [x] 8.6 Testar `/admin/users/[userId]`: dados corretos de perfil + assinatura + contagens
  - [x] 8.7 Testar "Gerar link de pagamento": URL do portal Stripe gerada e exibida
  - [x] 8.8 Testar "Estender +7 dias": `currentPeriodEnd` atualizado no banco
  - [x] 8.9 Testar proteção: usuário com role USER tentando acessar `/admin/users` → redirect para `/chat`
  - [x] 8.10 Testar API sem auth: 401 retornado; com USER role: 403 retornado

## Dev Notes

### Pré-requisitos das Stories Anteriores

Esta story depende das Stories 5.1 e 5.2 (e toda Epic 2/3 base) estarem concluídas:

**Da Story 5.1 (Admin Dashboard):**
- `src/app/(admin)/layout.tsx` — Layout admin com sidebar 240px, breadcrumbs
- `src/components/layout/admin-sidebar.tsx` — Sidebar com navegação admin
- `src/app/(admin)/dashboard/page.tsx` — Dashboard de métricas
- `src/app/api/admin/analytics/route.ts` — API de analytics
- `src/app/api/admin/conversations/route.ts` — API de conversas admin
- Middleware de auth já protege `(admin)/*` rotas — redireciona usuários sem role ADMIN
- SWR instalado: `npm install swr` (verificar antes de usar)

**Da Story 5.2 (Gestão de Agentes):**
- `src/components/admin/` directory com padrões estabelecidos
- `src/lib/validations/admin.ts` com schemas Zod para admin (leadSchema, keywordSchema)
- `src/types/admin.ts` com tipos admin
- `src/actions/admin-actions.ts` com `updateSpecialist`, `manageLead`

**Da Story 3.1-3.3 (Stripe):**
- `src/lib/stripe.ts` — Stripe client singleton
- Dependência instalada: `stripe`
- `stripeCustomerId` presente no modelo Subscription

**Da Story 2.1 (Auth):**
- `src/lib/auth.ts` com `auth()` e `session.user.role`
- Middleware protege `/admin/*` para role ADMIN

### Estado Atual do Codebase (Admin Users Related)

| Componente | Status | Ação Nesta Story |
|---|---|---|
| `src/app/(admin)/users/page.tsx` | Não existe | Criar página de listagem |
| `src/app/(admin)/users/[userId]/page.tsx` | Não existe | Criar página de detalhes |
| `src/app/api/admin/users/route.ts` | Não existe | Criar GET handler com paginação |
| `src/app/api/admin/users/[userId]/route.ts` | Não existe | Criar GET handler para detalhes |
| `src/app/api/admin/users/[userId]/actions/route.ts` | Não existe | Criar POST handler para ações |
| `src/components/admin/users-table.tsx` | Não existe | Criar componente com SWR + Table |
| `src/components/admin/user-detail-card.tsx` | Não existe | Criar componente de detalhes |
| `src/components/layout/admin-sidebar.tsx` | Criado na Story 5.1 | Adicionar link "Utilisateurs" |
| `src/app/api/admin/conversations/route.ts` | Criado na Story 5.1 | Verificar suporte a ?userId= filter |

### Padrão de Autorização Admin — CRÍTICO

Todos os route handlers em `/api/admin/*` DEVEM seguir este padrão:

```typescript
const session = await auth();
if (!session?.user?.id) {
  return Response.json(
    { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
    { status: 401 }
  );
}
if (session.user.role !== 'ADMIN') {
  return Response.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
    { status: 403 }
  );
}
```

**O middleware de auth (Story 2.1) também protege `/admin/*` pages para role ADMIN** — redireciona para `/chat` com 403. Mas as APIs devem ter sua própria verificação.

### SWR — Padrão para Admin Components

```typescript
// Componente client que usa SWR para buscar dados de admin
'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data);

// Com debounce para busca
const { data, isLoading, error } = useSWR(
  `/api/admin/users?search=${debouncedSearch}&page=${page}`,
  fetcher,
  { keepPreviousData: true } // Manter dados anteriores durante paginação
);
```

**Implementação do debounce sem biblioteca extra:**
```typescript
const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300);
  return () => clearTimeout(timer);
}, [search]);
```

### Paginação — Formato Padrão da Arquitetura

```typescript
// Response format para listas paginadas (padrão obrigatório)
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 98,
    "hasMore": true
  }
}

// Prisma query com paginação
const skip = (page - 1) * limit;
const [items, total] = await Promise.all([
  prisma.user.findMany({ where, skip, take: limit }),
  prisma.user.count({ where }),
]);
```

### Excluir Campos Sensíveis do User (RGPD + Segurança)

Ao retornar dados de usuário na API admin, NUNCA retornar:
- `password` (hash bcrypt) — campo adicionado na Story 2.1
- Tokens OAuth internos (nos modelos Account)

Usar `select` explícito:
```typescript
prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    // NÃO incluir: password
    subscriptions: { ... },
    _count: { select: { messages: true, conversations: true } },
  },
});
```

### Ações Admin — Detalhes Técnicos

**Gerar Link de Pagamento (generate-portal-link):**
- Requer `stripeCustomerId` na subscription do usuário
- Usa `stripe.billingPortal.sessions.create()` igual à Story 3.4
- A URL gerada é válida por 5 minutos (padrão Stripe)
- O admin deve copiar e partilhar com o usuário via outro canal (email manual, chat de suporte)
- Nota: Story 6.2 (emails transacionais) automatizará o envio do link via email

**Estender Período de Graça (extend-grace-period):**
- Atualiza apenas o campo `currentPeriodEnd` no Prisma (não altera Stripe diretamente)
- Esta abordagem é válida para suporte em modo MVP pois:
  - O middleware de gating (Story 3.3) verifica `currentPeriodEnd` do nosso DB
  - Não sincroniza com Stripe — apenas um "override" local para suporte
- **Limitação conhecida**: Webhook `customer.subscription.updated` pode sobrescrever este valor se Stripe processar renovação. Para produção real, usar `stripe.subscriptions.update()` com `trial_end`.

### Componentes ShadCN Disponíveis e Utilizados

| Componente | Status | Uso nesta Story |
|---|---|---|
| `Table` | `components/ui/table.tsx` ✓ | Tabela de usuários |
| `Badge` | Verificar se instalado | Status badges (Actif, etc.) |
| `Input` | `components/ui/input.tsx` ✓ | Campo de busca |
| `Button` | `components/ui/button.tsx` ✓ | Ações, paginação |
| `Card` | `components/ui/card.tsx` ✓ | User detail container |
| `Skeleton` | `components/ui/skeleton.tsx` ✓ | Loading states |
| `Tabs` | `components/ui/tabs.tsx` ✓ | Abas no user detail (Perfil, Assinaturas, Conversas) |
| `Dialog` | `components/ui/dialog.tsx` ✓ | Confirmação de ações destrutivas (se necessário) |
| `Sonner (toast)` | `components/ui/sonner.tsx` ✓ | Feedback de ações |
| `Tooltip` | `components/ui/tooltip.tsx` ✓ | Tooltips nas ações da tabela |

**Verificar Badge**: `ls src/components/ui/ | grep badge` — se não existir: `npx shadcn@latest add badge`

### Estrutura de Dados — Query Completa para User Detail

```typescript
// Dados completos de um usuário para a página de detalhes
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    image: true,
    createdAt: true,
    subscriptions: {
      include: {
        specialist: {
          select: { name: true, domain: true, accentColor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    },
    _count: {
      select: {
        messages: true,
        conversations: true,
      },
    },
    // NÃO incluir: password, accounts (OAuth tokens)
  },
});
```

### Ficheiros a Criar/Modificar

```
NOVOS:
src/app/(admin)/users/page.tsx                        # Server Component: lista de usuários
src/app/(admin)/users/[userId]/page.tsx               # Server Component: detalhes do usuário
src/app/api/admin/users/route.ts                      # GET: lista paginada com busca
src/app/api/admin/users/[userId]/route.ts             # GET: detalhes completos do usuário
src/app/api/admin/users/[userId]/actions/route.ts     # POST: generate-portal-link, extend-grace-period
src/components/admin/users-table.tsx                  # Client Component: tabela com SWR + debounce
src/components/admin/user-detail-card.tsx             # Client Component: detalhes + ações admin

MODIFICADOS:
src/components/layout/admin-sidebar.tsx               # Adicionar link "Utilisateurs" (Story 5.1)
src/app/api/admin/conversations/route.ts              # Verificar/adicionar ?userId= filter (Story 5.1)
```

### Guardrails — O Que NÃO Fazer

- **NÃO** esquecer a verificação `session.user.role !== 'ADMIN'` em TODOS os route handlers `/api/admin/*`
- **NÃO** retornar o campo `password` (hash bcrypt) nas respostas da API de usuários
- **NÃO** implementar busca server-side sem debounce no cliente — causaria muitas requests ao digitar
- **NÃO** usar `import` de `stripe` no Client Component — Stripe SDK é server-side only
- **NÃO** deletar usuários no admin panel — não é requisito desta story
- **NÃO** cancelar assinaturas de outros usuários via admin — não é requisito desta story
- **NÃO** expor `stripeCustomerId` ou `stripeSubscriptionId` na resposta da API pública/listagem
- **NÃO** buscar dados do Stripe em cada linha da tabela de usuários (N+1 problem) — apenas dados do Prisma na listagem; Stripe apenas no detalhe do usuário
- **NÃO** criar rotas no route group `(dashboard)` — admin vive em `(admin)`
- **NÃO** usar `server actions` para as operações admin (são chamadas via API routes + SWR, não forms)

### Dependências entre Stories

| Story | Relação | Impacto |
|---|---|---|
| 5.1 (done by then) | **Pré-requisito direto** | Admin layout, sidebar, admin conversations API, SWR instalado |
| 5.2 (done by then) | **Pré-requisito direto** | Admin component patterns, admin-actions.ts, validations/admin.ts, types/admin.ts |
| 3.1-3.4 (done by then) | Pré-requisito de dados | Stripe SDK instalado, stripeCustomerId em Subscription, Stripe Customer Portal |
| 2.1-2.2 (done by then) | Pré-requisito base | Auth.js v5, role ADMIN no User model, session.user.role disponível |
| 5.4 (backlog) | Futura — relacionada | Analytics por agente — reutiliza queries Prisma similares |
| 6.2 (backlog) | Futura — relacionada | Emails transacionais — automatizará envio do link de pagamento gerado aqui |

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.3 Acceptance Criteria completa, FR35/FR36/FR37, Epic 5 Overview, Story 5.1-5.2 context]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Boundaries admin/* (Auth + role ADMIN), Component Boundaries admin/ (SWR), pagination response format, admin component directory structure, admin-actions.ts, types/admin.ts, validations/admin.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md — Server Action Pattern, API Response Pattern, Error Codes (FORBIDDEN 403), API Naming conventions, SWR 2.x usage]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Admin sidebar (240px, Usuários item), Journey 4 (Admin), Table components, breadcrumbs, skeleton loading, admin layout patterns]
- [Source: _bmad-output/planning-artifacts/prd.md — FR35 (listar/pesquisar usuários), FR36 (detalhes assinatura), FR37 (resolver problemas de pagamento), NFR13 (admin acessível apenas por ADMIN role)]
- [Source: prisma/schema.prisma — User model (sem password no select), Subscription model (status, stripeCustomerId, currentPeriodEnd), Message._count, Conversation._count]
- [Source: _bmad-output/implementation-artifacts/3-4-gestao-de-pagamento-portal-stripe.md — Stripe Portal session creation pattern, stripeCustomerId usage]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `asChild` prop não suportada no Button do `@base-ui/react` — substituído por `buttonVariants` com `<Link>` para links estilizados como botão
- `SheetTrigger` usa `render` prop em vez de `asChild` para composição no `@base-ui/react`
- Stories 5.1 e 5.2 ainda não implementadas ao iniciar esta story — infraestrutura admin (middleware, layout, sidebar) criada aqui como pré-requisito

### Completion Notes List

- Story implementada com sucesso — todas as ACs satisfeitas
- Infraestrutura admin criada: `src/middleware.ts`, `src/types/admin.ts`, `src/lib/admin-nav.ts`, `src/components/admin/admin-sidebar.tsx` (com suporte mobile via Sheet), `src/components/admin/breadcrumbs.tsx`, layout admin completo
- API `/api/admin/users/*` criada com padrão de autenticação dupla (401 + 403)
- Senha (`password`) nunca exposta nas respostas — `select` explícito usado no Prisma
- SWR com `keepPreviousData: true` e debounce 300ms implementado sem biblioteca extra
- Estender período de graça = update local no Prisma (não Stripe) — limitação MVP documentada
- Gerar link de pagamento = Stripe Customer Portal session para o `stripeCustomerId`
- N+1 evitado: dados Stripe apenas no detalhe do usuário, não na listagem
- `admin/conversations/route.ts` criado com suporte completo a `?userId=` filter + paginação
- Lint: ✅ sem erros (warning pré-existente em `agents-data-table.tsx` de Story 5.2)
- TypeScript: ✅ sem erros nos arquivos desta story

### File List

**Criados:**
- `src/middleware.ts`
- `src/types/admin.ts`
- `src/lib/admin-nav.ts`
- `src/app/(admin)/layout.tsx` (atualizado de placeholder)
- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/breadcrumbs.tsx`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[userId]/route.ts`
- `src/app/api/admin/users/[userId]/actions/route.ts`
- `src/app/api/admin/conversations/route.ts`
- `src/components/admin/users-table.tsx`
- `src/components/admin/user-detail-card.tsx`
- `src/app/(admin)/users/page.tsx`
- `src/app/(admin)/users/[userId]/page.tsx`

## Change Log

- 2026-03-12: Implementação completa da Story 5.3 — Gestão de Usuários & Assinaturas (Admin)
  - Criada infraestrutura admin base (middleware, layout, sidebar, breadcrumbs, admin-nav)
  - Criadas APIs `/api/admin/users` (lista paginada), `/api/admin/users/[userId]` (detalhes), `/api/admin/users/[userId]/actions` (generate-portal-link, extend-grace-period)
  - Criada API `/api/admin/conversations` com suporte a `?userId=` filter
  - Criados componentes `UsersTable` (SWR + debounce 300ms) e `UserDetailCard` (ações admin)
  - Criadas páginas `/admin/users` e `/admin/users/[userId]` com verificação dupla de role ADMIN
