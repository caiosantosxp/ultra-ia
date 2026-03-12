---
project_name: 'ultra-ia'
user_name: 'Vinicius'
date: '2026-03-12'
sections_completed: ['technology_stack']
existing_patterns_found: 24
---

# Project Context for AI Agents

_Este arquivo contém regras críticas e padrões que agentes AI DEVEM seguir ao implementar código neste projeto. Foco em detalhes não óbvios que os agentes costumam errar._

---

## Technology Stack & Versions

| Tecnologia | Versão | Notas |
|---|---|---|
| Next.js | 16.1.6 | App Router, Turbopack em dev |
| React | 19.2.3 | Server Components por padrão |
| TypeScript | 5.x | `strict: true` obrigatório |
| Tailwind CSS | 4.x | Nova sintaxe (sem tailwind.config.js) |
| **ShadCN UI** | shadcn 4.0.3 | Usa **@base-ui/react 1.2.0** — NÃO é Radix UI |
| Prisma | 7.4.2 | Com `@prisma/adapter-pg` (PrismaPg) |
| Auth.js | v5 beta (next-auth 5.0.0-beta.30) | Database sessions + PrismaAdapter |
| Zod | 4.3.6 | Nova API (z.string().min() funciona igual) |
| React Hook Form | 7.71.2 | Sempre com zodResolver |
| bcrypt | 6.0.0 | Salt rounds = 12 |
| Resend | 6.9.3 | Serviço de email transacional |
| Sonner | 2.0.7 | Toast notifications |
| next-themes | 0.4.6 | Dark/light mode |
| Lucide React | 0.577.0 | Ícones |
| CVA | 0.7.1 | Class Variance Authority para variantes |

---

## Critical Implementation Rules

### 🔴 CRÍTICO — ShadCN usa @base-ui/react, NÃO Radix UI

Este projeto usa `@base-ui/react` como primitiva para os componentes ShadCN, **não** `@radix-ui`. Isso muda a API dos componentes:

```tsx
// ❌ ERRADO — Padrão Radix UI (não funciona aqui)
<SheetTrigger asChild>
  <Button>Abrir</Button>
</SheetTrigger>

// ✅ CORRETO — Padrão base-ui
<SheetTrigger render={<Button>Abrir</Button>} />
```

**Sempre usar `render={}` prop em vez de `asChild` em Trigger components.**

---

### 🔴 CRÍTICO — Prisma usa PrismaPg Adapter (não PrismaClient padrão)

O banco usa PostgreSQL com o adapter `@prisma/adapter-pg`. Nunca instanciar `PrismaClient` sem o adapter:

```typescript
// ❌ ERRADO
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ CORRETO — usar o singleton de src/lib/prisma.ts
import { prisma } from '@/lib/prisma';

// src/lib/prisma.ts (já existe, NÃO recriar)
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
```

**Sempre importar `prisma` de `@/lib/prisma` — nunca criar nova instância.**

---

### 🔴 CRÍTICO — Auth.js v5: API diferente do NextAuth v4

```typescript
// ✅ CORRETO — importar de @/lib/auth (já configurado)
import { auth } from '@/lib/auth';

// Em Server Components
const session = await auth();

// Em API Routes / Route Handlers
import { auth } from '@/lib/auth';
export const { GET, POST } = auth; // handlers exportados
```

A configuração completa já está em `src/lib/auth.ts`. **Não recriar ou reimportar de 'next-auth' diretamente.**

---

### 🟡 IMPORTANTE — Estrutura de Route Groups

```
src/app/
├── (public)/     # SSR — landing, specialist page, privacy, terms
│                 # Sem autenticação requerida
├── (auth)/       # Login, register, forgot-password, reset-password
│                 # Redireciona para /chat se já autenticado (middleware)
├── (dashboard)/  # Área autenticada — chat, settings, perfil
│                 # Protegida pelo middleware
├── (admin)/      # Painel admin — apenas role ADMIN
└── api/          # API Routes — N8N proxy, Stripe webhooks, CRUD
```

**Nunca misturar lógica de Server Component SSR com lógica de Client Component sem necessidade.**

---

### 🟡 IMPORTANTE — Padrão de Resposta de API

Todas as Server Actions e API routes devem retornar:

```typescript
// ✅ CORRETO
return { success: true, data: result };
return { success: false, error: 'MENSAGEM_ERRO' };

// ❌ ERRADO — não lançar erros não tratados, não retornar formatos ad-hoc
throw new Error('algo deu errado');
return result; // sem wrapper
```

---

### 🟡 IMPORTANTE — Server Components por Padrão

```typescript
// ✅ CORRETO — componente sem 'use client' = Server Component
export function SpecialistCard({ specialist }) { ... }

// 'use client' APENAS quando necessário:
// - useState, useEffect, useRef, useReducer
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs (window, localStorage)
// - Animações / libs que precisam do DOM
'use client';
export function ChatHeroPreview() { ... }
```

**Data fetching em Server Components diretamente com Prisma — sem API routes para dados internos.**

---

### 🟡 IMPORTANTE — Conventions de Naming

| Tipo | Convenção | Exemplo |
|---|---|---|
| Arquivos de componente | kebab-case.tsx | `specialist-card.tsx` |
| Exports de componente | PascalCase | `export function SpecialistCard()` |
| Funções/variáveis | camelCase | `const getSpecialists = async ()` |
| Constantes globais | UPPER_SNAKE_CASE | `export const APP_URL` |
| Arquivos de página | page.tsx (App Router) | `src/app/(public)/page.tsx` |
| Arquivos de layout | layout.tsx | `src/app/(public)/layout.tsx` |
| Testes co-localizados | mesmo dir, `.test.tsx` | `specialist-card.test.tsx` |

---

### 🟡 IMPORTANTE — Import Order (ESLint enforced)

O ESLint enforça a seguinte ordem de imports — **não alterar**:

```typescript
// 1. Builtin Node.js
import fs from 'fs';

// 2. Externo (npm packages)
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

// 3. Interno (@/*)
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// 4. Componentes internos
import { Button } from '@/components/ui/button';
import { SpecialistCard } from '@/components/specialist/specialist-card';

// 5. Types
import type { Metadata } from 'next';
```

---

### 🟡 IMPORTANTE — Tailwind CSS 4 (sem config file)

```typescript
// ❌ ERRADO — Tailwind 4 não usa tailwind.config.js para tokens custom
// (a menos que configurado explicitamente)

// ✅ CORRETO — usar CSS custom properties em globals.css
// Os tokens do design system estão em src/app/globals.css
// Ex: var(--primary), var(--background), var(--foreground)

// Classes utilitárias continuam iguais:
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="bg-surface"  // token custom definido em globals.css
```

---

### 🟢 PADRÃO — Acessibilidade Obrigatória

```tsx
// ✅ SEMPRE incluir:
<img alt="Descrição da imagem" />           // alt em imagens
<button aria-label="Fechar menu" />          // aria-label em ícones
<nav aria-label="Navegação principal" />     // aria em nav elements
focus-visible:ring-2                         // NÃO usar focus: — usar focus-visible:
role="article"                               // roles semânticos quando necessário

// ✅ HTML semântico — zero div-soup
<header>, <main>, <footer>, <nav>, <article>, <section>
```

---

### 🟢 PADRÃO — buttonVariants (não Button direto em Links)

```tsx
// ✅ CORRETO — Links que parecem botões
import { buttonVariants } from '@/components/ui/button-variants';
<Link href="/login" className={buttonVariants({ variant: 'secondary' })}>
  Se connecter
</Link>

// Para botões reais
import { Button } from '@/components/ui/button';
<Button onClick={handleClick}>Salvar</Button>
```

---

### 🟢 PADRÃO — Variáveis de Ambiente

```typescript
// Sempre importar constantes de @/lib/constants
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@/lib/constants';

// Nunca acessar process.env diretamente em componentes client-side
// NEXT_PUBLIC_* = disponível no client
// Sem prefixo = apenas server-side
```

---

## Project Structure Quick Reference

```
src/
├── actions/          # Server Actions (auth-actions.ts, profile-actions.ts)
├── app/
│   ├── (public)/     # SSR público
│   ├── (auth)/       # Autenticação
│   ├── (dashboard)/  # Área logada
│   ├── (admin)/      # Admin (a implementar)
│   └── api/          # Route Handlers
├── components/
│   ├── ui/           # ShadCN components + button-variants.ts
│   ├── layout/       # header.tsx, footer.tsx, mobile-nav.tsx
│   ├── specialist/   # specialist-card.tsx, chat-hero-preview.tsx, quick-prompt.tsx
│   ├── auth/         # Formulários de auth
│   ├── shared/       # theme-toggle, session-provider, cookie-consent
│   └── dashboard/    # Componentes da área logada
├── lib/
│   ├── auth.ts       # Auth.js v5 config
│   ├── prisma.ts     # PrismaClient singleton com PrismaPg
│   ├── constants.ts  # APP_NAME, APP_URL, APP_DESCRIPTION
│   ├── email.ts      # Resend config
│   ├── fonts.ts      # Poppins + Inter
│   └── validations/  # Schemas Zod (auth.ts, profile.ts)
├── types/
│   └── next-auth.d.ts # Augmentação de tipos Auth.js
prisma/
├── schema.prisma     # Modelos: User, Specialist, Conversation, Message, Subscription, Lead, Keyword
├── seed.ts           # Seed: specialist "gestion-entreprise"
└── migrations/       # 20260312011419_init
```

---

## Database Models Quick Reference

| Model | Campos Chave |
|---|---|
| User | id, name, email, password(nullable), role(USER/ADMIN), accounts, sessions |
| Specialist | id, name, slug(unique), domain, price(cents), accentColor, avatarUrl, tags[], quickPrompts[], isActive |
| Conversation | id, userId, specialistId, isDeleted(soft delete RGPD) |
| Message | id, conversationId, userId, content, role(USER/ASSISTANT) |
| Subscription | id, userId, specialistId, stripeSubscriptionId(unique), status(PENDING/ACTIVE/PAST_DUE/CANCELED/EXPIRED) |
| PasswordResetToken | id, token(unique), email, expiresAt, usedAt |
| Lead | id, email(unique), score, source |
| Keyword | id, name(unique), weight |

---

## Commands Reference

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run format       # Prettier write
npm run prisma:seed  # tsx prisma/seed.ts

npx prisma migrate dev --name <name>  # Nova migration
npx prisma migrate reset              # Reset DB (dev only)
npx prisma studio                     # GUI do banco
```
