---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-10'
inputDocuments: ['prd.md', 'ux-design-specification.md', 'product-brief-ultra-ia-2026-03-09.md']
workflowType: 'architecture'
project_name: 'ultra-ia'
user_name: 'Vinicius'
date: '2026-03-10'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Requisitos Funcionais (42 FRs):**

| Categoria | FRs | Implicação Arquitetural |
|---|---|---|
| Autenticação & Usuários (FR1-FR5) | Cadastro email/senha + Google OAuth, perfil, hierarquia admin/user | NextAuth com providers múltiplos, middleware de autorização por role |
| Página Pública do Especialista (FR6-FR11) | Banner, bio, sugestões clicáveis, contador de membros, CTA | SSR para SEO, dados públicos sem autenticação, cache de conteúdo estático |
| Chat Inteligente (FR12-FR22) | Chat com IA via N8N, streaming, histórico, busca, limite mensagens/dia | SSE/WebSocket para streaming, persistência de conversas, rate limiting, integração N8N como serviço externo |
| Sistema de Pagamento (FR23-FR28) | Stripe Checkout, assinaturas, webhooks, controle de acesso por status | Stripe integration layer, webhook handler, middleware de subscription gating |
| Painel Administrativo (FR29-FR42) | Dashboard métricas, analytics, gestão conversas, leads, keywords, personalização, segurança | Queries agregadas, analytics pipeline, sistema de leads com scoring, CRUD admin |

**Requisitos Não-Funcionais Chave (21 NFRs):**

| NFR | Implicação Arquitetural |
|---|---|
| Performance: resposta streaming < 2s para primeiro token | Conexão SSE/WebSocket persistente, N8N low-latency |
| Segurança: RGPD compliance | Anonimização de dados, consent management, data deletion endpoints |
| Escalabilidade: suportar crescimento de assinantes | Stateless API, connection pooling PostgreSQL, horizontal scaling readiness |
| Acessibilidade: WCAG 2.1 AA | Componentes acessíveis (Radix UI base), semantic HTML, ARIA |
| Disponibilidade: 99.5%+ uptime | Health checks, graceful degradation, error boundaries |
| SEO: páginas públicas indexáveis | SSR com Next.js App Router para rotas públicas |

**Implicações UX para Arquitetura:**

| Aspecto UX | Implicação Técnica |
|---|---|
| Dark + Light mode | CSS custom properties via `next-themes`, design tokens |
| Streaming word-by-word | SSE com buffer de tokens, componente StreamingIndicator |
| 16 componentes ShadCN + 9 custom | Component library layer, design system abstraction |
| Desktop-first com 5 breakpoints | Responsive layout system, container queries |
| Sidebar colapsável no chat | Client-side state management para layout |
| 5 fluxos de jornada distintos | Routing architecture com guards por estado (auth, subscription, trial) |

### Scale & Complexity

- **Domínio primário:** Full-stack web application (SaaS B2C)
- **Nível de complexidade:** Médio-Alto
- **Componentes arquiteturais estimados:** ~12-15 módulos distintos
- **Integrações externas:** 3 críticas (N8N/IA, Stripe, OAuth providers)
- **Features real-time:** Streaming de respostas IA (SSE/WebSocket)
- **Multi-tenancy:** Parcial — dados isolados por usuário, admin vê tudo
- **Compliance regulatório:** RGPD (mercado europeu)

### Technical Constraints & Dependencies

1. **N8N como orquestrador de IA** — Dependência externa crítica. Primeira experiência da equipe com N8N. Ponto de falha único para o core do produto (chat com IA). Requer: health monitoring, fallback strategy, timeout handling
2. **GPT 5.2 + Claude** — Dependência de APIs externas de IA com custos variáveis por uso. GPT 5.2 para respostas, Claude para assimilação de conteúdo. Requer: cost tracking, rate limiting, error handling robusto
3. **Stripe** — Infraestrutura de pagamento com webhooks assíncronos. Requer: idempotency, webhook verification, subscription state machine
4. **Next.js App Router** — Arquitetura híbrida SSR (público) + SPA (autenticado). Requer: clara separação de route groups, middleware de auth
5. **PostgreSQL + Prisma** — Schema relacional com ORM. Requer: migrations strategy, connection pooling, query optimization para analytics

### Cross-Cutting Concerns Identified

1. **Autenticação & Autorização** — Permeia todas as rotas e APIs. 2 roles (admin/user), subscription gating, rate limiting por plano
2. **Error Handling & Resilience** — Especialmente crítico nas integrações externas (N8N, Stripe, APIs de IA). Graceful degradation necessário
3. **Observabilidade** — Logging, métricas, health checks. Essencial para N8N (primeira experiência) e custos de API de IA
4. **Internacionalização** — Interface em francês (MVP), estrutura preparada para multi-idioma (v2.0)
5. **Segurança de Dados** — RGPD compliance em todo o stack: conversas, dados pessoais, analytics, leads
6. **State Management** — Chat streaming, sidebar, theme, subscription status — múltiplos estados client-side a coordenar

## Starter Template Evaluation

### Primary Technology Domain

Full-stack Web Application (SaaS B2C) baseado em Next.js 16.1 (versão estável atual, março 2026)

### Starter Options Considered

| Starter | Prós | Contras | Alinhamento com PRD |
|---|---|---|---|
| **create-next-app** (oficial) | Base limpa, oficial Vercel, Next.js 16.1, Turbopack, sem opiniões extras | Requer setup manual de Prisma, Auth, Stripe | Alto — sem dependências desnecessárias |
| **create-t3-app** | TypeSafe end-to-end, inclui Prisma + NextAuth + Tailwind | Inclui tRPC (não previsto no PRD), adiciona complexidade desnecessária | Médio — tRPC é overhead não solicitado |
| **Next.js SaaS Starter** (oficial) | Inclui Stripe, auth, dashboard | Usa Drizzle ORM (PRD especifica Prisma), padrões podem conflitar | Baixo — ORM divergente |
| **SaaS Boilerplate (ixartz)** | Multi-tenancy, i18n, roles, testes | Muito opinado, dependências pesadas, curva de aprendizado alta | Baixo — over-engineering para MVP |
| **Horizon AI Boilerplate** | Template ChatGPT-like com ShadCN | Muito específico, difícil customizar, código proprietário | Baixo — visual fechado |

### Selected Starter: create-next-app + shadcn init

**Rationale:**

1. **Alinhamento máximo com PRD** — O PRD especifica API Routes padrão do Next.js, não tRPC. Usar create-next-app evita adicionar abstrações não solicitadas
2. **Controle total** — Base limpa permite configurar Prisma, NextAuth e Stripe exatamente como o PRD define, sem conflitos de padrões
3. **Next.js 16.1** — Versão mais recente com Turbopack FS caching, React 19, bundle analyzer
4. **ShadCN UI como segunda camada** — `shadcn@latest init` adiciona o design system (Radix UI + Tailwind) com componentes on-demand, alinhado com a estratégia de 16 componentes ShadCN + 9 custom do UX spec
5. **Simplicidade para equipe intermediate** — Menos magic, mais clareza no código

**Initialization Commands:**

```bash
# 1. Criar projeto Next.js 16.1
npx create-next-app@latest ultra-ia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack

# 2. Inicializar ShadCN UI
npx shadcn@latest init -t next

# 3. Dependências core (a configurar nas stories de implementação)
npm install prisma @prisma/client next-auth @auth/prisma-adapter stripe next-themes
```

**Architectural Decisions Provided by Starter:**

| Aspecto | Decisão |
|---|---|
| Language & Runtime | TypeScript 5.x strict, React 19, Node.js |
| Styling | Tailwind CSS 4.x + ShadCN UI (Radix primitives) |
| Build (Dev) | Turbopack com FS caching |
| Build (Prod) | Webpack com bundle analyzer |
| Routing | Next.js App Router com route groups |
| Path Aliases | @/* para imports limpos |
| Linting | ESLint configuração Next.js |

**Code Organization:**

```
src/
├── app/                    # App Router (route groups, layouts, pages)
│   ├── (public)/          # Rotas públicas SSR (landing, specialist page)
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Área autenticada SPA
│   ├── (admin)/           # Painel administrativo
│   └── api/               # API Routes (N8N proxy, Stripe webhooks, CRUD)
├── components/            # Componentes React (ShadCN + custom)
│   ├── ui/               # ShadCN UI components
│   └── custom/           # 9 custom components (ChatMessage, etc.)
├── lib/                   # Utilities, configs, helpers
├── prisma/               # Schema, migrations, seed
└── public/               # Static assets
```

**Note:** A inicialização do projeto com estes comandos será a primeira story de implementação.

## Core Architectural Decisions

### Decision Priority Analysis

**Decisões Críticas (Bloqueiam Implementação):**
1. Estratégia de sessão — Database Sessions (Auth.js + Prisma Adapter)
2. Protocolo de streaming — SSE (Server-Sent Events)
3. Hospedagem — Vercel (Next.js) + Neon (PostgreSQL) + N8N Cloud
4. Validação — Zod 3.24

**Decisões Importantes (Moldam a Arquitetura):**
5. State management — Zustand 5.x
6. Data fetching — SWR 2.x (client) + React Server Components (server)
7. Formulários — React Hook Form 7.x + Zod resolver
8. Rate limiting — Custom middleware (in-memory Map)

**Decisões Adiadas (Pós-MVP):**
- Cache distribuído (Redis) — in-memory suficiente para MVP
- CDN para assets estáticos — Vercel CDN incluso
- Full-text search — PostgreSQL `ILIKE` suficiente para MVP
- Message queue — N8N lida com orquestração assíncrona

### Data Architecture

| Decisão | Escolha | Versão | Rationale |
|---|---|---|---|
| **ORM** | Prisma | 6.x | Definido no PRD. Type-safe, migrations automáticas, bom ecossistema |
| **Validação** | Zod | 3.24 | Standard com Next.js Server Actions. Validação em runtime no boundary (API routes, forms). Schemas compartilháveis entre client/server |
| **Connection Pooling** | Prisma built-in + Neon serverless driver | — | Prisma gerencia pool. Neon oferece connection pooling serverless via PgBouncer integrado |
| **Migrations** | Prisma Migrate | — | `prisma migrate dev` em desenvolvimento, `prisma migrate deploy` em produção |
| **Caching** | Next.js built-in (ISR + fetch cache) | — | `unstable_cache` para queries frequentes (contador membros, métricas dashboard). Sem Redis no MVP |
| **Seed Data** | Prisma Seed | — | `prisma/seed.ts` para dados do especialista IA, planos Stripe, configurações default |

**Schema Approach:**
- Modelos relacionais: User, Account, Session, Conversation, Message, Subscription, Specialist, Lead, Keyword
- Soft delete para conversas (RGPD: possibilidade de anonimizar vs deletar)
- Timestamps `createdAt`/`updatedAt` em todos os modelos
- Índices em: `userId`, `specialistId`, `conversationId`, `createdAt` (queries de analytics)

### Authentication & Security

| Decisão | Escolha | Rationale |
|---|---|---|
| **Session Strategy** | Database Sessions | Com Prisma Adapter, é o default do Auth.js. Permite invalidar sessões server-side, essencial para RGPD |
| **Auth Library** | Auth.js v5 (NextAuth) | Providers: Credentials (email/senha) + Google OAuth. Prisma Adapter |
| **Password Hashing** | bcrypt | Salt rounds = 12 |
| **Authorization** | Middleware + Role Check | Next.js middleware para route protection. Helper `auth()` em Server Components. Enum `Role { USER, ADMIN }` |
| **Rate Limiting** | Custom middleware (in-memory Map) | Rate limit por IP (público) e por userId (autenticado). Limite mensagens/dia por subscription. Migrar para Redis ao escalar |
| **RGPD Compliance** | Cookie consent + Data endpoints | Banner de consentimento, API para export/delete dados, anonimização de conversas |
| **API Security** | CSRF + Headers + Zod validation | Next.js CSRF built-in para Server Actions. Headers via `next.config.js`. Zod em todas as API routes |
| **Stripe Webhooks** | Signature verification | `stripe.webhooks.constructEvent()` + idempotency via `event.id` |

### API & Communication Patterns

| Decisão | Escolha | Rationale |
|---|---|---|
| **API Pattern** | Next.js Route Handlers (REST-like) | API routes em `app/api/`. Sem tRPC — complexidade desnecessária |
| **Streaming Protocol** | Server-Sent Events (SSE) | Streaming unidirecional (IA → client). Mais simples que WebSocket, suportado nativamente. `ReadableStream` no Route Handler |
| **N8N Communication** | HTTP Webhooks (REST) | N8N expõe webhooks HTTP. Next.js chama via `fetch()`, recebe resposta streaming |
| **Error Handling** | Standardized Error Types | `{ success, data, error }` pattern. Códigos tipados: AUTH_ERROR, RATE_LIMIT, N8N_TIMEOUT, STRIPE_ERROR, VALIDATION_ERROR |
| **API Versioning** | Não versionar (MVP) | Único consumer (frontend próprio) |

**SSE Streaming Flow:**
```
Client → POST /api/chat/stream (message + conversationId)
  → Server valida auth + rate limit + subscription
  → Server chama N8N webhook (HTTP POST)
  → N8N processa via GPT 5.2
  → N8N retorna stream → Server proxy via SSE (ReadableStream)
  → Client recebe tokens word-by-word via EventSource
  → Server persiste mensagem completa no DB ao finalizar stream
```

### Frontend Architecture

| Decisão | Escolha | Versão | Rationale |
|---|---|---|---|
| **State Management** | Zustand | 5.x | 1.16KB gzipped. Sem Provider wrapper. Stores: chat, ui, subscription |
| **Forms** | React Hook Form + Zod resolver | RHF 7.x | Validação Zod compartilhada com Server Actions. Uncontrolled inputs para performance |
| **Data Fetching (Server)** | React Server Components | — | Fetch em Server Components para dados iniciais. `unstable_cache` para dados frequentes |
| **Data Fetching (Client)** | SWR | 2.x | Revalidação automática, cache, deduplicação. Lista de conversas, métricas dashboard |

**Zustand Stores:**
- `stores/chat-store.ts` — Estado do chat ativo (messages, streaming status, current conversation)
- `stores/ui-store.ts` — Sidebar, modals, layout state
- `stores/subscription-store.ts` — Status da assinatura (cache client)

### Infrastructure & Deployment

| Decisão | Escolha | Rationale |
|---|---|---|
| **Next.js Hosting** | Vercel (Pro, $20/mês) | Otimizado para Next.js 16.1. Edge network, SSE streaming, preview deploys. Região EU (RGPD) |
| **Database** | Neon PostgreSQL (serverless) | Free tier → Launch. Connection pooling via PgBouncer. Branching para dev/preview. EU (Frankfurt) |
| **N8N** | N8N Cloud (Starter, ~€20/mês) | Managed hosting. Migrar para self-hosted se custo escalar |
| **CI/CD** | GitHub Actions | Lint + type-check + testes em PRs. Deploy automático via Vercel |
| **Monitoring** | Sentry + Vercel Analytics | Sentry (error tracking, source maps). Vercel Analytics (Core Web Vitals) |
| **Environment Config** | `.env.local` + Vercel Env Vars | Variáveis sensíveis no Vercel dashboard. `.env.example` documentando variáveis |

**Custo estimado MVP (mensal):**

| Serviço | Custo |
|---|---|
| Vercel Pro | $20/mês |
| Neon PostgreSQL | $0-19/mês |
| N8N Cloud | ~€20/mês |
| Stripe | 1.5% + €0.25/tx |
| Sentry | $0 (free tier) |
| OpenAI + Anthropic | Variável por uso |
| **Total base** | **~€45-65/mês** |

### Decision Impact Analysis

**Sequência de Implementação:**
1. Projeto Next.js + ShadCN UI (starter)
2. Prisma schema + Neon database
3. Auth.js + providers (Credentials, Google)
4. Layout base (route groups, middleware auth)
5. Stripe integration (checkout, webhooks)
6. Chat interface + SSE streaming + N8N
7. Admin panel (dashboard, analytics)

**Dependências Cross-Component:**
- Auth.js ↔ Prisma (adapter) ↔ Neon (database)
- Chat streaming ↔ N8N (webhook) ↔ Zustand (state) ↔ SSE (protocol)
- Stripe webhooks ↔ Prisma (subscription state) ↔ Middleware (access control)
- Sentry ↔ Todos os módulos (error tracking global)

## Implementation Patterns & Consistency Rules

### Pontos de Conflito Identificados

**28 áreas** onde agentes IA poderiam tomar decisões diferentes sem regras explícitas.

### Naming Patterns

**Database Naming (Prisma Schema):**

| Elemento | Convenção | Exemplo |
|---|---|---|
| Modelos | PascalCase (singular) | `User`, `Conversation`, `Message` |
| Campos | camelCase | `userId`, `createdAt`, `isActive` |
| Tabelas (DB mapeada) | snake_case (plural) via `@@map` | `@@map("users")`, `@@map("conversations")` |
| Foreign Keys | camelCase com sufixo `Id` | `userId`, `specialistId`, `conversationId` |
| Enums | PascalCase (nome) + UPPER_SNAKE (valores) | `enum Role { USER, ADMIN }` |
| Índices | Prisma auto-nomeados | `@@index([userId, createdAt])` |
| Relações | camelCase (singular/plural conforme cardinalidade) | `user User`, `messages Message[]` |

```prisma
// CORRETO
model Conversation {
  id           String    @id @default(cuid())
  title        String?
  userId       String
  specialistId String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  isDeleted    Boolean   @default(false)
  user         User      @relation(fields: [userId], references: [id])
  specialist   Specialist @relation(fields: [specialistId], references: [id])
  messages     Message[]
  @@map("conversations")
  @@index([userId, createdAt])
}
```

**API Naming (Route Handlers):**

| Elemento | Convenção | Exemplo |
|---|---|---|
| Endpoints | kebab-case, plural, substantivos | `/api/conversations`, `/api/chat/stream` |
| Route params | camelCase | `[conversationId]`, `[specialistId]` |
| Query params | camelCase | `?sortBy=createdAt&limit=20` |
| Request body | camelCase | `{ "messageContent": "...", "conversationId": "..." }` |
| Response body | camelCase | `{ "data": { "userId": "..." } }` |

```
// CORRETO
GET    /api/conversations
GET    /api/conversations/[conversationId]
POST   /api/conversations
POST   /api/chat/stream
POST   /api/webhooks/stripe
GET    /api/admin/analytics

// ERRADO
GET    /api/getConversations     (verbo no endpoint)
GET    /api/conversation/123     (singular)
POST   /api/chat_stream          (underscore)
```

**Code Naming (TypeScript/React):**

| Elemento | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `ChatMessage`, `SpecialistCard` |
| Arquivos componentes | kebab-case.tsx | `chat-message.tsx`, `specialist-card.tsx` |
| Hooks | camelCase com `use` prefix | `useChat`, `useSubscription` |
| Utilities/helpers | camelCase | `formatDate`, `validateMessage` |
| Constantes | UPPER_SNAKE_CASE | `MAX_MESSAGES_PER_DAY`, `API_BASE_URL` |
| Types/Interfaces | PascalCase com sufixo descritivo | `ConversationWithMessages`, `CreateUserInput` |
| Zustand stores | camelCase com sufixo `Store` | `useChatStore`, `useUiStore` |
| Zod schemas | camelCase com sufixo `Schema` | `createMessageSchema`, `loginSchema` |
| Server Actions | camelCase com prefixo de ação | `createConversation`, `deleteMessage`, `updateProfile` |
| Env variables | UPPER_SNAKE com prefixo | `DATABASE_URL`, `NEXT_PUBLIC_STRIPE_KEY`, `N8N_WEBHOOK_URL` |

### Structure Patterns

**Organização de Componentes — Por Feature (conforme Step 3 Code Organization).**

**Testes — Co-localizados ao lado do arquivo testado:**
```
src/components/chat/chat-message.tsx
src/components/chat/chat-message.test.tsx
src/lib/validations/chat.ts
src/lib/validations/chat.test.ts
src/app/api/conversations/route.ts
src/app/api/conversations/route.test.ts
```

### Format Patterns

**API Response Format (Padrão Obrigatório):**

```typescript
// SUCESSO
{ "success": true, "data": { ... } }

// ERRO
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Message content is required" } }

// LISTA COM PAGINAÇÃO
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 145, "hasMore": true } }
```

**Códigos de Erro Padronizados:**

| Código | HTTP Status | Uso |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input inválido (Zod validation) |
| `AUTH_REQUIRED` | 401 | Não autenticado |
| `FORBIDDEN` | 403 | Sem permissão (role/subscription) |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `RATE_LIMIT` | 429 | Limite de requisições excedido |
| `N8N_TIMEOUT` | 504 | N8N não respondeu a tempo |
| `N8N_ERROR` | 502 | Erro na comunicação com N8N |
| `STRIPE_ERROR` | 502 | Erro na comunicação com Stripe |
| `INTERNAL_ERROR` | 500 | Erro interno não categorizado |

**Datas:**
- API: sempre ISO 8601 (`"2026-03-10T14:30:00.000Z"`)
- UI: formatação francesa via `date-fns/locale/fr` (`"10 mars 2026 à 14:30"`)

### Communication Patterns

**Zustand Store Pattern (Obrigatório):**

```typescript
import { create } from 'zustand'

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  currentConversationId: string | null
  addMessage: (message: Message) => void
  setStreaming: (status: boolean) => void
  setConversation: (id: string | null) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentConversationId: null,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (status) => set({ isStreaming: status }),
  setConversation: (id) => set({ currentConversationId: id }),
  reset: () => set({ messages: [], isStreaming: false, currentConversationId: null }),
}))
```

**Server Action Pattern (Obrigatório):**

```typescript
'use server'
import { auth } from '@/lib/auth'
import { createMessageSchema } from '@/lib/validations/chat'
import { prisma } from '@/lib/prisma'

export async function createMessage(input: unknown) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }
  // 2. Input validation (Zod)
  const parsed = createMessageSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } }
  // 3. Authorization check (ownership/permissions)
  // 4. Business logic
  try {
    const result = await prisma.message.create({ data: { ... } })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create message' } }
  }
}
```

### Process Patterns

**Error Handling — 3 Camadas:**

| Camada | Responsabilidade | Implementação |
|---|---|---|
| API Route / Server Action | Validação, auth, erros de negócio | Try/catch + error response + Sentry.captureException |
| React Error Boundary | Erros de renderização | `error.tsx` em cada route group |
| Client-side | Erros de UI, network | Toast notifications via ShadCN `useToast()` |

**Loading States — Suspense para Server Components, useTransition para client:**

```typescript
// Server Components
<Suspense fallback={<ConversationListSkeleton />}>
  <ConversationList />
</Suspense>

// Client-side
const [isPending, startTransition] = useTransition()
```

**Import Order (Obrigatório):**
1. React/Next.js
2. Bibliotecas externas
3. Components internos (@/)
4. Lib/utils internos
5. Types
6. Stores

### Enforcement Guidelines

**Todos os agentes IA DEVEM:**

1. Seguir convenções de naming exatamente como documentado
2. Usar o padrão `{ success, data, error }` em toda API route e Server Action
3. Validar input com Zod em todo boundary (API routes, Server Actions, forms)
4. Seguir a ordem: auth → validate → authorize → execute em Server Actions
5. Colocar testes co-localizados ao lado do arquivo testado
6. Usar `@/` path alias para todos os imports internos
7. Criar componentes em `kebab-case.tsx` dentro da pasta feature correspondente
8. Usar Zustand para estado client-side, nunca React Context para estado global
9. Formatar datas em ISO 8601 nas APIs e com `date-fns/locale/fr` no UI
10. Logar erros via `Sentry.captureException()` antes de retornar error response

**Pattern Enforcement:**
- ESLint rules para import order e naming conventions
- Prisma schema validation via `prisma validate`
- TypeScript strict mode para type safety
- Pre-commit hook: lint + type-check

## Project Structure & Boundaries

### Complete Project Directory Structure

```
ultra-ia/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Lint + type-check + tests on PRs
│       └── deploy-migrations.yml           # Prisma migrate deploy on main
├── .env.example                            # Documentação de todas as env vars
├── .env.local                              # Variáveis locais (gitignored)
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json                         # ShadCN UI config
├── package.json
├── package-lock.json
├── sentry.client.config.ts
├── sentry.server.config.ts
├── middleware.ts                           # Auth + rate limiting + redirects
├── prisma/
│   ├── schema.prisma                       # Database schema completo
│   ├── seed.ts                             # Seed data (specialist, plans)
│   └── migrations/                         # Prisma migrations (auto-generated)
├── public/
│   ├── favicon.ico
│   ├── images/
│   │   ├── specialists/                    # Fotos dos especialistas
│   │   └── og/                             # Open Graph images para SEO
│   └── fonts/                              # Poppins + Inter (self-hosted)
└── src/
    ├── app/
    │   ├── layout.tsx                      # Root layout (ThemeProvider, Toaster, AuthProvider)
    │   ├── globals.css                     # Tailwind imports + CSS custom properties
    │   ├── not-found.tsx                   # 404 page
    │   ├── error.tsx                       # Global error boundary
    │   ├── (public)/                       # Páginas públicas (SSR)
    │   │   ├── layout.tsx                  # Layout público (header + footer)
    │   │   ├── page.tsx                    # Landing page
    │   │   ├── specialist/[slug]/page.tsx  # Página pública do especialista
    │   │   ├── pricing/page.tsx            # Planos/pricing
    │   │   ├── privacy/page.tsx            # Política de privacidade (RGPD)
    │   │   └── terms/page.tsx              # Termos de uso
    │   ├── (auth)/                         # Autenticação
    │   │   ├── layout.tsx                  # Layout auth (centrado, minimal)
    │   │   ├── login/page.tsx              # Login (email/senha + Google)
    │   │   ├── register/page.tsx           # Cadastro
    │   │   └── error/page.tsx              # Auth error page
    │   ├── (dashboard)/                    # Área autenticada
    │   │   ├── layout.tsx                  # Layout dashboard (sidebar + header)
    │   │   ├── chat/page.tsx               # Lista de conversas
    │   │   ├── chat/[conversationId]/page.tsx # Chat ativo com streaming
    │   │   ├── settings/page.tsx           # Configurações do perfil
    │   │   └── billing/page.tsx            # Gestão de assinatura Stripe
    │   ├── (admin)/                        # Painel admin
    │   │   ├── layout.tsx                  # Layout admin
    │   │   ├── dashboard/page.tsx          # Dashboard métricas
    │   │   ├── conversations/page.tsx      # Lista de conversas (admin)
    │   │   ├── conversations/[conversationId]/page.tsx
    │   │   ├── analytics/page.tsx          # Analytics detalhado
    │   │   ├── leads/page.tsx              # Gestão de leads
    │   │   ├── keywords/page.tsx           # Keywords de scoring
    │   │   └── settings/page.tsx           # Personalização + segurança
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts # Auth.js handler
    │       ├── chat/stream/route.ts        # POST: SSE streaming (N8N proxy)
    │       ├── conversations/route.ts      # GET: list, POST: create
    │       ├── conversations/[conversationId]/route.ts  # GET, DELETE
    │       ├── conversations/[conversationId]/messages/route.ts
    │       ├── specialists/[slug]/route.ts # GET: dados públicos
    │       ├── subscription/route.ts       # GET: status, POST: checkout
    │       ├── subscription/portal/route.ts # POST: Stripe portal
    │       ├── webhooks/stripe/route.ts    # POST: Stripe webhook
    │       ├── admin/analytics/route.ts    # GET: analytics
    │       ├── admin/conversations/route.ts
    │       ├── admin/leads/route.ts        # GET, POST, PATCH
    │       ├── admin/keywords/route.ts     # GET, POST, DELETE
    │       ├── user/route.ts               # GET, PATCH profile
    │       ├── user/data-export/route.ts   # GET: RGPD export
    │       └── user/data-delete/route.ts   # DELETE: RGPD deletion
    ├── components/
    │   ├── ui/                             # ShadCN UI (auto-generated)
    │   ├── chat/                           # Chat feature
    │   │   ├── chat-message.tsx
    │   │   ├── streaming-indicator.tsx
    │   │   ├── chat-input.tsx
    │   │   ├── conversation-sidebar.tsx
    │   │   ├── conversation-list.tsx
    │   │   └── conversation-list-skeleton.tsx
    │   ├── specialist/                     # Specialist feature
    │   │   ├── specialist-card.tsx
    │   │   ├── quick-prompt.tsx
    │   │   └── chat-hero-preview.tsx
    │   ├── dashboard/                      # Dashboard widgets
    │   │   ├── usage-meter.tsx
    │   │   ├── metrics-card.tsx
    │   │   └── payment-banner.tsx
    │   ├── admin/                          # Admin components
    │   │   ├── analytics-chart.tsx
    │   │   ├── leads-table.tsx
    │   │   ├── conversations-table.tsx
    │   │   └── keywords-manager.tsx
    │   ├── layout/                         # Layout components
    │   │   ├── header.tsx
    │   │   ├── sidebar.tsx
    │   │   ├── admin-sidebar.tsx
    │   │   ├── footer.tsx
    │   │   └── mobile-nav.tsx
    │   └── shared/                         # Cross-feature
    │       ├── disclaimer-banner.tsx
    │       ├── theme-toggle.tsx
    │       ├── loading-spinner.tsx
    │       ├── cookie-consent.tsx
    │       └── empty-state.tsx
    ├── lib/
    │   ├── auth.ts                         # Auth.js config
    │   ├── prisma.ts                       # Prisma client singleton
    │   ├── stripe.ts                       # Stripe client + helpers
    │   ├── n8n.ts                          # N8N webhook client + streaming
    │   ├── sentry.ts                       # Sentry config helpers
    │   ├── utils.ts                        # cn() + general helpers
    │   ├── constants.ts                    # App constants
    │   └── validations/
    │       ├── auth.ts                     # loginSchema, registerSchema
    │       ├── chat.ts                     # createMessageSchema
    │       ├── subscription.ts             # checkoutSchema
    │       └── admin.ts                    # leadSchema, keywordSchema
    ├── stores/
    │   ├── chat-store.ts                   # Messages, streaming, conversation
    │   ├── ui-store.ts                     # Sidebar, modals, layout
    │   └── subscription-store.ts           # Subscription status cache
    ├── types/
    │   ├── index.ts                        # Shared types + re-exports
    │   ├── chat.ts                         # Chat-specific types
    │   ├── admin.ts                        # Admin-specific types
    │   └── api.ts                          # API response types
    ├── hooks/
    │   ├── use-chat.ts                     # Chat + streaming logic
    │   ├── use-subscription.ts             # Subscription status + gating
    │   ├── use-streaming.ts                # SSE EventSource management
    │   └── use-rate-limit.ts               # Client-side rate limit feedback
    ├── actions/
    │   ├── auth-actions.ts                 # login, register, logout
    │   ├── chat-actions.ts                 # createConversation, deleteConversation
    │   ├── profile-actions.ts              # updateProfile, deleteAccount
    │   └── admin-actions.ts                # updateSpecialist, manageLead
    └── styles/
        └── globals.css                     # Tailwind + CSS custom properties

```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Acesso | Proteção |
|---|---|---|
| `/api/auth/*` | Público | Auth.js handler |
| `/api/specialists/*` | Público | Cache (ISR) |
| `/api/webhooks/stripe` | Stripe only | Signature verification |
| `/api/chat/*` | Autenticado + Subscription | Auth + subscription middleware |
| `/api/conversations/*` | Autenticado (owner) | Auth + ownership check |
| `/api/subscription/*` | Autenticado | Auth middleware |
| `/api/user/*` | Autenticado (self) | Auth + self-only check |
| `/api/admin/*` | Admin only | Auth + role ADMIN check |

**Component Boundaries:**

| Boundary | Comunicação |
|---|---|
| `components/ui/` | Props only — nunca acessam store ou API |
| `components/chat/` | Zustand `useChatStore` + hooks |
| `components/specialist/` | Props from Server Components (SSR) |
| `components/dashboard/` | SWR para dados + props |
| `components/admin/` | SWR + Server Actions |
| `components/layout/` | Zustand `useUiStore` |
| `components/shared/` | Props only — sem dependências de feature |

**Data Boundaries:**

| Camada | Acessa |
|---|---|
| Server Components | Prisma diretamente |
| Server Actions | Prisma + Zod validation |
| API Routes | Prisma + N8N + Stripe |
| Client Components | Zustand stores + SWR |
| Hooks | Stores + API via SWR/fetch |

### Requirements to Structure Mapping

| FR Category | Pages | Components | API Routes | Actions |
|---|---|---|---|---|
| Auth (FR1-FR5) | `(auth)/*` | `shared/` | `api/auth/` | `auth-actions.ts` |
| Specialist (FR6-FR11) | `(public)/specialist/[slug]` | `specialist/` | `api/specialists/` | — (SSR) |
| Chat (FR12-FR22) | `(dashboard)/chat/*` | `chat/` | `api/chat/`, `api/conversations/` | `chat-actions.ts` |
| Payment (FR23-FR28) | `(dashboard)/billing`, `(public)/pricing` | `dashboard/` | `api/subscription/`, `api/webhooks/stripe` | — |
| Admin (FR29-FR42) | `(admin)/*` | `admin/` | `api/admin/*` | `admin-actions.ts` |
| RGPD | `(public)/privacy`, `(dashboard)/settings` | `shared/cookie-consent` | `api/user/data-*` | `profile-actions.ts` |

### Integration Points

```
Next.js (Vercel) ──► N8N Cloud (AI orchestration) ──► GPT 5.2 / Claude
       │
       ├──► Neon PostgreSQL (data persistence)
       ├──► Stripe (payments + webhooks)
       ├──► Google OAuth (authentication)
       └──► Sentry (error tracking)
```

**Data Flow — Chat Streaming:**
```
User Input → chat-input.tsx → useChat hook → POST /api/chat/stream
  → middleware.ts (auth + rate limit) → route.ts (Zod + N8N call)
  → N8N → GPT 5.2 → Stream via ReadableStream (SSE)
  → useStreaming hook → useChatStore (token by token)
  → On end: persist to Prisma
```

### Environment Variables (.env.example)

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_ID="price_..."
# N8N
N8N_WEBHOOK_URL="https://..."
N8N_API_KEY="..."
# Sentry
SENTRY_DSN="..."
NEXT_PUBLIC_SENTRY_DSN="..."
# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Todas as 19 decisões tecnológicas são compatíveis entre si. Next.js 16.1 + React 19 + TypeScript 5.x + Prisma 6.x + Auth.js v5 + ShadCN UI + Tailwind CSS 4.x + Zustand 5.x + SWR 2.x + Zod 3.24 — stack coerente sem conflitos de versão.

**Pattern Consistency:** Naming conventions (camelCase JS, snake_case DB, kebab-case files), API response format `{ success, data, error }`, Zod validation em boundaries, import order — todos alinhados e sem contradições.

**Structure Alignment:** Route groups separando contextos de acesso, componentes por feature, testes co-localizados, separação clara entre Server Components/Client Components — estrutura suporta todas as decisões.

### Requirements Coverage ✅

**42 FRs:** Todos cobertos — Auth (FR1-5), Specialist (FR6-11), Chat (FR12-22), Payment (FR23-28), Admin (FR29-42)

**21 NFRs:** Performance (SSE streaming), RGPD (data endpoints + consent), Escalabilidade (Vercel serverless + Neon auto-scaling), WCAG 2.1 AA (ShadCN/Radix), SEO (SSR route groups), Uptime 99.5% (Vercel + Neon SLAs)

### Implementation Readiness ✅

- 19/19 decisões documentadas com versões e rationale
- ~80 arquivos/diretórios mapeados
- 10 regras de enforcement com exemplos de código
- Padrões Zustand Store e Server Action com templates completos
- Códigos de erro padronizados (9 tipos)
- Boundaries API, Component e Data definidos

### Gap Analysis

**Sem gaps críticos.** Gaps menores não-bloqueantes:
- Testing framework → Decidir no setup (Vitest + Testing Library recomendado)
- Prisma schema detalhado → Detalhar na story de database setup
- i18n strategy → Hardcoded FR no MVP, `next-intl` para v2.0
- Structured logging → `console.log` + Sentry no MVP

### Architecture Readiness Assessment

**Status:** PRONTO PARA IMPLEMENTAÇÃO
**Confiança:** Alta

**Primeira Prioridade:**
```bash
npx create-next-app@latest ultra-ia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
npx shadcn@latest init -t next
```
