# Story 1.1: Inicialização do Projeto & Design System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **the project initialized with Next.js 16.1, ShadCN UI, Prisma, and the design system configured**,
so that **all subsequent stories can be built on a solid, consistent foundation**.

## Acceptance Criteria

1. **Given** um repositório vazio **When** o projeto é inicializado **Then** o projeto Next.js 16.1 está criado com TypeScript, Tailwind, ESLint, App Router, src-dir e import alias @/*
2. **And** ShadCN UI está inicializado com componentes base disponíveis
3. **And** Prisma está instalado e configurado com conexão ao Neon PostgreSQL
4. **And** a estrutura de pastas segue a arquitetura definida (route groups: public, auth, dashboard, admin; components, lib, stores, types, hooks, actions)
5. **And** o design system está configurado: CSS custom properties para light/dark mode, cores primárias (#2563EB), tipografia (Poppins headings + Inter body) self-hosted
6. **And** next-themes está configurado com toggle dark/light mode sem flicker
7. **And** root layout inclui ThemeProvider, Toaster e structure HTML semântica
8. **And** `.env.example` documenta todas as variáveis de ambiente necessárias
9. **And** ESLint e Prettier estão configurados conforme padrões da arquitetura
10. **And** o projeto roda localmente com `npm run dev` sem erros

## Tasks / Subtasks

- [x] Task 1: Inicialização do projeto Next.js (AC: #1)
  - [x] 1.1 Executar `npx create-next-app@latest ultra-ia --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack`
  - [x] 1.2 Verificar que o projeto compila e roda com `npm run dev`
  - [x] 1.3 Limpar ficheiros boilerplate (page.tsx padrão, estilos padrão)

- [x] Task 2: Inicializar ShadCN UI (AC: #2)
  - [x] 2.1 Executar `npx shadcn@latest init --defaults`
  - [x] 2.2 Instalar componentes base necessários: `button`, `input`, `textarea`, `card`, `avatar`, `scroll-area`, `dialog`, `dropdown-menu`, `sidebar`, `badge`, `separator`, `sonner` (toast deprecated), `tooltip`, `tabs`, `table`, `switch`, `skeleton`
  - [x] 2.3 Verificar que `components.json` está configurado corretamente

- [x] Task 3: Configurar Prisma com Neon PostgreSQL (AC: #3)
  - [x] 3.1 Instalar: `npm install prisma @prisma/client`
  - [x] 3.2 Executar `npx prisma init`
  - [x] 3.3 Configurar `schema.prisma` com provider postgresql (Prisma 7 usa prisma.config.ts para URLs)
  - [x] 3.4 Criar schema completo com todos os modelos (User, Account, Session, Specialist, Conversation, Message, Subscription, Lead, Keyword) e enums (Role, SubscriptionStatus)
  - [x] 3.5 Criar `src/lib/prisma.ts` com singleton do PrismaClient
  - [x] 3.6 Validar schema com `npx prisma validate`

- [x] Task 4: Criar estrutura de pastas (AC: #4)
  - [x] 4.1 Criar route groups: `src/app/(public)/`, `src/app/(auth)/`, `src/app/(dashboard)/`, `src/app/(admin)/`
  - [x] 4.2 Criar layouts placeholder para cada route group
  - [x] 4.3 Criar estrutura de componentes: `src/components/ui/`, `src/components/chat/`, `src/components/specialist/`, `src/components/dashboard/`, `src/components/admin/`, `src/components/layout/`, `src/components/shared/`
  - [x] 4.4 Criar estrutura lib: `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/stripe.ts`, `src/lib/n8n.ts`, `src/lib/utils.ts`, `src/lib/constants.ts`, `src/lib/validations/`
  - [x] 4.5 Criar pastas: `src/stores/`, `src/types/`, `src/hooks/`, `src/actions/`, `src/styles/`
  - [x] 4.6 Criar `prisma/schema.prisma`, `prisma/seed.ts`
  - [x] 4.7 Criar `public/fonts/`, `public/images/specialists/`, `public/images/og/`
  - [x] 4.8 Criar `middleware.ts` na raiz (placeholder com comentários)

- [x] Task 5: Configurar Design System — CSS Custom Properties & Cores (AC: #5)
  - [x] 5.1 Configurar `src/app/globals.css` com CSS custom properties para light e dark mode
  - [x] 5.2 Definir cores Light mode: background #FFFFFF, surface #F8FAFC, text-primary #111827, text-secondary #6B7280, primary #2563EB, primary-hover #1D4ED8, border #E5E7EB
  - [x] 5.3 Definir cores Dark mode: background #0F172A, surface #1E293B, text-primary #F1F5F9, text-secondary #94A3B8, primary #3B82F6, primary-hover #60A5FA, border #334155
  - [x] 5.4 Definir cores Semânticas: success #10B981, warning #F59E0B, error #EF4444, info #3B82F6
  - [x] 5.5 Integrar com Tailwind config (CSS variables via ShadCN pattern)

- [x] Task 6: Configurar Design System — Tipografia (AC: #5)
  - [x] 6.1 Descarregar fontes Poppins (600, 700) e Inter (400-600) para `public/fonts/`
  - [x] 6.2 Configurar `next/font/local` para self-hosting das fontes
  - [x] 6.3 Aplicar Poppins para headings e Inter para body via CSS/Tailwind
  - [x] 6.4 Configurar type scale: H1 36px/700, H2 30px/600, H3 24px/600, H4 20px/600

- [x] Task 7: Configurar next-themes (AC: #6)
  - [x] 7.1 next-themes já instalado (via ShadCN)
  - [x] 7.2 Criar ThemeProvider wrapper com `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
  - [x] 7.3 Criar componente `src/components/shared/theme-toggle.tsx` com ícones sol/lua usando Switch do ShadCN
  - [x] 7.4 Verificar que não há flicker no carregamento (script blocking do next-themes)

- [x] Task 8: Configurar Root Layout (AC: #7)
  - [x] 8.1 Configurar `src/app/layout.tsx` com ThemeProvider, Toaster, fontes self-hosted
  - [x] 8.2 Definir `lang="fr"` no HTML
  - [x] 8.3 Configurar metadata base (title, description, viewport)
  - [x] 8.4 Estrutura HTML semântica com `<main>`, skip-link, TooltipProvider

- [x] Task 9: Criar .env.example (AC: #8)
  - [x] 9.1 Criar ficheiro `.env.example` com todas as variáveis documentadas
  - [x] 9.2 Criar excepção `.env.example` no `.gitignore`

- [x] Task 10: Configurar ESLint e Prettier (AC: #9)
  - [x] 10.1 Configurar `eslint.config.mjs` (flat config ESLint 9) com regras no-unused-vars, prefer-const
  - [x] 10.2 Instalar e configurar Prettier: `npm install -D prettier`
  - [x] 10.3 Criar `.prettierrc` com: semi true, trailingComma es5, singleQuote true, printWidth 100, tabWidth 2
  - [x] 10.4 Adicionar scripts no `package.json`: `lint`, `format`, `format:check`, `type-check`

- [x] Task 11: Validação final (AC: #10)
  - [x] 11.1 Executar `next build` — projeto compila sem erros
  - [x] 11.2 Executar `npm run lint` — zero erros/warnings
  - [x] 11.3 Executar `npm run type-check` — zero erros de TypeScript
  - [x] 11.4 Toggle dark/light mode implementado com ThemeToggle component
  - [x] 11.5 Fontes Poppins e Inter configuradas via next/font/local

## Dev Notes

### Padrões de Arquitetura Obrigatórios

- **API Response Pattern:** `{ success: true, data: {...} }` para sucesso, `{ success: false, error: { code, message } }` para erro
- **9 Error Codes Padronizados:** VALIDATION_ERROR (400), AUTH_REQUIRED (401), FORBIDDEN (403), NOT_FOUND (404), RATE_LIMIT (429), N8N_TIMEOUT (504), N8N_ERROR (502), STRIPE_ERROR (502), INTERNAL_ERROR (500)
- **Server Actions Pattern:** auth → validate → authorize → execute
- **Validação Zod** em todas as API routes e Server Actions
- **Import Order Obrigatório:** React/Next → Libs externas → Components → Lib/utils → Types → Stores
- **Naming Conventions:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars), UPPER_SNAKE (constantes)
- **Testes co-localizados** ao lado do ficheiro testado
- **Pre-commit hook:** lint + type-check

### Design System — Especificações Completas

**Cores Light Mode:**
| Token | Valor Hex | Uso |
|-------|-----------|-----|
| background | #FFFFFF | Fundo principal |
| surface | #F8FAFC | Cards, áreas elevadas |
| text-primary | #111827 | Texto principal |
| text-secondary | #6B7280 | Texto secundário, labels |
| primary | #2563EB | CTAs, links, acentos |
| primary-hover | #1D4ED8 | Hover em elementos primários |
| border | #E5E7EB | Bordas, separadores |

**Cores Dark Mode:**
| Token | Valor Hex | Uso |
|-------|-----------|-----|
| background | #0F172A | Fundo principal |
| surface | #1E293B | Cards, áreas elevadas |
| text-primary | #F1F5F9 | Texto principal |
| text-secondary | #94A3B8 | Texto secundário |
| primary | #3B82F6 | CTAs, links, acentos |
| primary-hover | #60A5FA | Hover em elementos primários |
| border | #334155 | Bordas, separadores |

**Cores Semânticas (ambos os modos):**
| Token | Valor Hex | Uso |
|-------|-----------|-----|
| success | #10B981 | Confirmações, status ativo |
| warning | #F59E0B | Alertas, limites próximos |
| error | #EF4444 | Erros, falhas |
| info | #3B82F6 | Dicas, informações contextuais |

**Tipografia — Type Scale Completa:**
| Nível | Tamanho | Line Height | Weight | Fonte | Uso |
|-------|---------|-------------|--------|-------|-----|
| H1 | 2.25rem (36px) | 1.2 | 700 | Poppins | Hero, títulos de página |
| H2 | 1.875rem (30px) | 1.25 | 600 | Poppins | Seções principais |
| H3 | 1.5rem (24px) | 1.3 | 600 | Poppins | Subseções |
| H4 | 1.25rem (20px) | 1.4 | 600 | Poppins | Card titles |
| Body Large | 1.125rem (18px) | 1.6 | 400 | Inter | Landing page body |
| Body | 1rem (16px) | 1.5 | 400 | Inter | Texto geral |
| Body Small | 0.875rem (14px) | 1.5 | 400 | Inter | UI labels, metadata |
| Caption | 0.75rem (12px) | 1.4 | 500 | Inter | Timestamps, badges |

**Espaçamento (base 4px):**
| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Espaço entre ícone e texto |
| sm | 8px | Padding de badges, gaps pequenos |
| md | 16px | Padding de cards, gap entre elementos |
| lg | 24px | Separação de seções menores |
| xl | 32px | Separação de seções principais |
| 2xl | 48px | Separação de blocos na landing page |
| 3xl | 64px | Margens de seção na landing page |

**Breakpoints:**
| Nome | Valor | Uso |
|------|-------|-----|
| sm | < 640px | Mobile |
| md | 640-768px | Tablet pequeno |
| lg | 768-1024px | Tablet |
| xl | > 1024px | Desktop |
| 2xl | > 1280px | Desktop grande |

**WCAG 2.1 AA Compliance:**
- Contraste mínimo: 4.5:1 (body), 3:1 (headings large)
- Touch targets mínimo: 44x44px
- `focus-visible:` em todos os elementos interativos (outline 2px #2563EB)
- `prefers-reduced-motion` respeitado
- `prefers-color-scheme` como fallback
- Semantic HTML: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>`
- Skip link no topo

### Prisma Schema Completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
  conversations Conversation[]
  subscriptions Subscription[]
  messages      Message[]
  @@map("users")
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?  @db.Text
  access_token       String?  @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?  @db.Text
  session_state      String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id        String   @id @default(cuid())
  sessionToken String @unique
  userId    String
  expires   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("sessions")
}

model Specialist {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  domain        String
  description   String   @db.Text
  price         Int
  accentColor   String
  avatarUrl     String
  tags          String[]
  quickPrompts  String[]
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  conversations Conversation[]
  subscriptions Subscription[]
  @@map("specialists")
  @@index([slug])
}

model Conversation {
  id            String   @id @default(cuid())
  title         String?
  userId        String
  specialistId  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  isDeleted     Boolean  @default(false)
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialist    Specialist @relation(fields: [specialistId], references: [id])
  messages      Message[]
  @@map("conversations")
  @@index([userId, createdAt])
  @@index([specialistId])
}

model Message {
  id              String   @id @default(cuid())
  conversationId  String
  userId          String
  content         String   @db.Text
  role            Role     @default(USER)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("messages")
  @@index([conversationId, createdAt])
}

model Subscription {
  id                    String   @id @default(cuid())
  userId                String
  specialistId          String
  stripeSubscriptionId  String   @unique
  stripeCustomerId      String
  status                SubscriptionStatus @default(PENDING)
  currentPeriodStart    DateTime?
  currentPeriodEnd      DateTime?
  cancelAtPeriodEnd     Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialist Specialist @relation(fields: [specialistId], references: [id])
  @@map("subscriptions")
  @@unique([userId, specialistId])
  @@index([userId])
  @@index([stripeSubscriptionId])
}

model Lead {
  id            String   @id @default(cuid())
  email         String
  name          String?
  score         Int      @default(0)
  source        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@map("leads")
  @@unique([email])
}

model Keyword {
  id            String   @id @default(cuid())
  name          String   @unique
  weight        Int      @default(1)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@map("keywords")
}

enum Role {
  USER
  ADMIN
}

enum SubscriptionStatus {
  PENDING
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}
```

### Prisma Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### ESLint Config

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "pathGroups": [{ "pattern": "@/**", "group": "internal" }],
      "pathGroupsExcludedImportTypes": ["builtin"]
    }],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error"
  }
}
```

### Prettier Config

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

### .env.example Completo

```bash
# Database (Neon PostgreSQL — EU Frankfurt)
DATABASE_URL="postgresql://user:password@localhost:5432/ultra_ia"
DIRECT_URL="postgresql://user:password@localhost:5432/ultra_ia"

# Authentication (Auth.js v5)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_PRICE_ID="price_..."

# N8N (AI Orchestration)
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/..."
N8N_API_KEY="your-n8n-api-key"

# Sentry (Error Tracking)
SENTRY_DSN="https://your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Zustand Store Patterns

```typescript
// stores/chat-store.ts — Padrão obrigatório
import { create } from 'zustand';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentConversationId: string | null;
  addMessage: (message: Message) => void;
  setStreaming: (status: boolean) => void;
  setConversation: (id: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentConversationId: null,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (status) => set({ isStreaming: status }),
  setConversation: (id) => set({ currentConversationId: id }),
  reset: () => set({ messages: [], isStreaming: false, currentConversationId: null }),
}));
```

**3 stores a criar (placeholder nesta story):**
1. `stores/chat-store.ts` — Messages, streaming, conversation
2. `stores/ui-store.ts` — Sidebar, modals, layout
3. `stores/subscription-store.ts` — Status da assinatura (cache client)

### Dependências a Instalar

```bash
# Core (nesta story)
npm install prisma @prisma/client next-themes

# Dev tools
npm install -D prettier

# Instalar depois nas stories seguintes (NÃO instalar agora):
# npm install next-auth @auth/prisma-adapter (Story 2.1)
# npm install stripe (Story 3.1)
# npm install zustand swr zod react-hook-form (Story 4.1)
# npm install @sentry/nextjs (quando configurar monitoring)
```

### Estrutura de Pastas Completa

```
ultra-ia/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── middleware.ts                    # Placeholder com comentários
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                      # Placeholder
├── public/
│   ├── fonts/                       # Poppins + Inter (self-hosted)
│   └── images/
│       ├── specialists/
│       └── og/
└── src/
    ├── app/
    │   ├── layout.tsx               # Root: ThemeProvider, Toaster, fontes
    │   ├── globals.css              # Tailwind + CSS custom properties
    │   ├── not-found.tsx            # 404
    │   ├── error.tsx                # Error boundary
    │   ├── (public)/
    │   │   ├── layout.tsx           # Header + Footer
    │   │   └── page.tsx             # Landing page placeholder
    │   ├── (auth)/
    │   │   └── layout.tsx           # Auth layout centrado
    │   ├── (dashboard)/
    │   │   └── layout.tsx           # Sidebar + Header
    │   └── (admin)/
    │       └── layout.tsx           # Admin layout
    ├── components/
    │   ├── ui/                      # ShadCN (auto-generated)
    │   ├── chat/
    │   ├── specialist/
    │   ├── dashboard/
    │   ├── admin/
    │   ├── layout/
    │   └── shared/
    │       └── theme-toggle.tsx     # Toggle dark/light
    ├── lib/
    │   ├── auth.ts                  # Placeholder
    │   ├── prisma.ts                # PrismaClient singleton
    │   ├── stripe.ts                # Placeholder
    │   ├── n8n.ts                   # Placeholder
    │   ├── utils.ts                 # cn() helper
    │   ├── constants.ts             # App constants
    │   └── validations/             # Zod schemas (placeholder)
    ├── stores/                      # Zustand stores (placeholder)
    ├── types/
    │   └── index.ts                 # Shared types
    ├── hooks/                       # Custom hooks (placeholder)
    └── actions/                     # Server actions (placeholder)
```

### Project Structure Notes

- Route groups `(public)`, `(auth)`, `(dashboard)`, `(admin)` isolam layouts sem afetar URLs
- Componentes organizados por feature, não por tipo
- `src/lib/` para utilitários e clientes de serviços
- `src/stores/` para Zustand (client-side state)
- `src/actions/` para Server Actions (server-side mutations)
- Ficheiros de validação Zod centralizados em `src/lib/validations/`
- Testes co-localizados: `component.tsx` → `component.test.tsx` no mesmo diretório

### Guardrails — O Que NÃO Fazer

- **NÃO** instalar dependências de stories futuras (auth, stripe, zustand, swr, zod, react-hook-form)
- **NÃO** implementar lógica de autenticação, pagamentos ou chat
- **NÃO** criar páginas completas — apenas layouts placeholder com estrutura semântica
- **NÃO** usar `@import` para fontes — usar `next/font/local` para self-hosting
- **NÃO** usar `focus:` — usar `focus-visible:` para indicadores de foco
- **NÃO** usar px para font-size — usar rem
- **NÃO** criar div-soup — usar HTML semântico
- **NÃO** esquecer `lang="fr"` no HTML root
- **NÃO** ignorar `prefers-reduced-motion` e `prefers-color-scheme`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — Starter Template, Folder Structure, Dependencies, Prisma Schema, ESLint/Prettier, .env.example, Middleware, API Patterns, Zustand Stores]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Color System, Typography, Spacing, Breakpoints, Components, Accessibility, Dark/Light Mode]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1 Overview, Story 1.1 Acceptance Criteria, Additional Requirements]
- [Source: _bmad-output/planning-artifacts/prd.md — FR1 (Discovery), FR2 (Public Pages), NFR1-NFR5 (Performance)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma 7 breaking change: `url`/`directUrl` moved from schema.prisma to prisma.config.ts
- ShadCN v4: `toast` component deprecated in favor of `sonner`
- ESLint 9: flat config format (`eslint.config.mjs`) instead of `.eslintrc.json`
- React 19 lint rule: `react-hooks/set-state-in-effect` — fixed using `useSyncExternalStore` for mounted check

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Story includes complete Prisma schema, ESLint/Prettier configs, design tokens, type scale, spacing system
- Guardrails section prevents scope creep into future stories
- All acceptance criteria mapped to specific tasks with subtasks

### Implementation Notes

- Next.js 16.1.6 with Turbopack initialized successfully
- ShadCN v4 (base-nova style) with 18 UI components installed
- Prisma 7.4.2 with complete schema (10 models, 2 enums) — validated successfully
- Design system: full color tokens (light/dark), type scale (H1-H4), semantic colors, WCAG focus-visible
- Fontes Poppins (600, 700) + Inter (variable 400-600) self-hosted via next/font/local
- ThemeProvider + ThemeToggle with useSyncExternalStore for SSR-safe mounting
- Root layout: lang="fr", ThemeProvider, TooltipProvider, Toaster, skip-link
- Build: 0 errors, Lint: 0 errors, TypeScript: 0 errors

### File List

**New files:**
- .env.example
- .gitignore
- .prettierrc
- components.json
- eslint.config.mjs
- middleware.ts
- next-env.d.ts
- next.config.ts
- package.json
- package-lock.json
- postcss.config.mjs
- prisma.config.ts
- prisma/schema.prisma
- prisma/seed.ts
- tsconfig.json
- public/fonts/poppins-600.woff2
- public/fonts/poppins-700.woff2
- public/fonts/inter-latin.woff2
- src/app/globals.css
- src/app/layout.tsx
- src/app/error.tsx
- src/app/not-found.tsx
- src/app/(public)/layout.tsx
- src/app/(public)/page.tsx
- src/app/(auth)/layout.tsx
- src/app/(dashboard)/layout.tsx
- src/app/(admin)/layout.tsx
- src/components/shared/theme-provider.tsx
- src/components/shared/theme-toggle.tsx
- src/components/ui/avatar.tsx
- src/components/ui/badge.tsx
- src/components/ui/button.tsx
- src/components/ui/card.tsx
- src/components/ui/dialog.tsx
- src/components/ui/dropdown-menu.tsx
- src/components/ui/input.tsx
- src/components/ui/scroll-area.tsx
- src/components/ui/separator.tsx
- src/components/ui/sheet.tsx
- src/components/ui/sidebar.tsx
- src/components/ui/skeleton.tsx
- src/components/ui/sonner.tsx
- src/components/ui/switch.tsx
- src/components/ui/table.tsx
- src/components/ui/tabs.tsx
- src/components/ui/textarea.tsx
- src/components/ui/tooltip.tsx
- src/hooks/use-mobile.ts
- src/lib/auth.ts
- src/lib/constants.ts
- src/lib/fonts.ts
- src/lib/n8n.ts
- src/lib/prisma.ts
- src/lib/stripe.ts
- src/lib/utils.ts
- src/types/index.ts

## Change Log

- 2026-03-10: Story 1.1 implemented — Project initialization with Next.js 16.1.6, ShadCN UI v4, Prisma 7, design system (colors, typography, dark/light mode), ESLint 9, Prettier
