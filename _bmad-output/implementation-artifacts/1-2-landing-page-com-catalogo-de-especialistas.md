# Story 1.2: Landing Page com Catálogo de Especialistas

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitor**,
I want **to see the landing page with the value proposition and specialist catalog**,
so that **I can understand what ultra-ia offers and discover available AI specialists**.

## Acceptance Criteria

1. **Given** um visitante acessa a URL raiz do site **When** a landing page carrega **Then** o hero split é exibido com texto de proposta de valor à esquerda e preview de chat à direita (ChatHeroPreview component)
2. **And** abaixo do hero, o catálogo de especialistas é exibido em grid responsivo (3 colunas desktop, 2 tablet, 1 mobile)
3. **And** cada SpecialistCard mostra avatar com cor de acento, nome, título, tags de expertise, 3 sugestões de perguntas com emoji, e CTA "Démarrer une conversation"
4. **And** o header fixo contém logo + nav links + CTA login
5. **And** o footer contém links legais, RGPD, e informações de contato
6. **And** a página é renderizada via SSR para SEO (meta tags, structured data)
7. **And** o FCP é inferior a 2 segundos (NFR2)
8. **And** a página é responsiva em todos os breakpoints (mobile, tablet, desktop)
9. **And** o modelo Specialist existe no Prisma com campos: id, name, slug, domain, description, price, accentColor, avatarUrl, tags, quickPrompts, isActive
10. **And** dados seed do especialista "Gestão Empresarial" estão carregados via `prisma/seed.ts`

## Tasks / Subtasks

- [ ] Task 1: Implementar seed data do especialista (AC: #9, #10)
  - [ ] 1.1 Implementar `prisma/seed.ts` com dados do especialista "Gestão Empresarial" (name, slug: "gestion-entreprise", domain: "Gestion d'Entreprise", description, price: 9900, accentColor: "#2563EB", avatarUrl, tags, quickPrompts com emoji, isActive: true)
  - [ ] 1.2 Adicionar script `"prisma:seed": "tsx prisma/seed.ts"` ao `package.json`
  - [ ] 1.3 Instalar `tsx` como dev dependency: `npm install -D tsx`
  - [ ] 1.4 Configurar seed no `prisma/schema.prisma` ou `package.json` (seed command)
  - [ ] 1.5 Executar `npx prisma db push` seguido de `npx prisma db seed` para validar
  - [ ] 1.6 Criar avatar placeholder em `public/images/specialists/gestion-entreprise.webp`

- [ ] Task 2: Criar Public Layout — Header (AC: #4)
  - [ ] 2.1 Criar `src/components/layout/header.tsx` — componente Server Component
  - [ ] 2.2 Header fixo (sticky top-0 z-50) com max-width 1280px centrado
  - [ ] 2.3 Logo à esquerda (texto "ultra-ia" com Poppins 700 ou SVG)
  - [ ] 2.4 Nav links ao centro/direita (items: "Spécialistes", "Tarifs", links âncora)
  - [ ] 2.5 CTA "Se connecter" à direita (Button variant secondary) — link para `/login`
  - [ ] 2.6 Mobile: hamburger menu (< 1024px) com DropdownMenu do ShadCN
  - [ ] 2.7 Backdrop blur no scroll (`bg-background/80 backdrop-blur-sm`)
  - [ ] 2.8 Theme toggle (importar de `shared/theme-toggle.tsx`)
  - [ ] 2.9 `<nav>` semântico com `aria-label="Navigation principale"`
  - [ ] 2.10 Skip link "Aller au contenu principal" como primeiro elemento

- [ ] Task 3: Criar Public Layout — Footer (AC: #5)
  - [ ] 3.1 Criar `src/components/layout/footer.tsx`
  - [ ] 3.2 Estrutura: logo + descrição breve | Links úteis | Links legais (RGPD)
  - [ ] 3.3 Links legais: "Politique de confidentialité" (`/privacy`), "Conditions d'utilisation" (`/terms`)
  - [ ] 3.4 Copyright: "© 2026 ultra-ia. Tous droits réservés."
  - [ ] 3.5 `<footer>` semântico, max-width 1280px centrado
  - [ ] 3.6 Responsivo: colunas no desktop → empilhado no mobile

- [ ] Task 4: Configurar Public Layout (AC: #4, #5)
  - [ ] 4.1 Implementar `src/app/(public)/layout.tsx` com Header + `<main>` + Footer
  - [ ] 4.2 Estrutura semântica: `<div className="min-h-screen flex flex-col">` → Header → `<main className="flex-1">` → Footer
  - [ ] 4.3 Assegurar que o layout herda do root layout (ThemeProvider, fontes já configurados na Story 1.1)

- [ ] Task 5: Criar componente ChatHeroPreview (AC: #1)
  - [ ] 5.1 Criar `src/components/specialist/chat-hero-preview.tsx` (Client Component — usa animação)
  - [ ] 5.2 Frame visual simulando janela de chat com bordas arredondadas e sombra
  - [ ] 5.3 Animar 3-4 mensagens simuladas mostrando: pergunta do user → resposta IA com perguntas de contexto → resposta personalizada
  - [ ] 5.4 Animação em loop com delay entre mensagens (typing effect ou fade-in sequencial)
  - [ ] 5.5 Respeitar `prefers-reduced-motion` — mostrar versão estática se ativado
  - [ ] 5.6 `aria-hidden="true"` (componente decorativo)
  - [ ] 5.7 Usar cores do design system: bolhas user (primary), bolhas AI (surface)
  - [ ] 5.8 Avatar do especialista na bolha AI (32px, com accentColor border)

- [ ] Task 6: Criar componente SpecialistCard (AC: #3)
  - [ ] 6.1 Criar `src/components/specialist/specialist-card.tsx` (Server Component)
  - [ ] 6.2 Props: `specialist: { name, slug, domain, description, accentColor, avatarUrl, tags, quickPrompts }`
  - [ ] 6.3 Layout: Avatar (80px) com ring da accentColor + Nome (H4, Poppins 600) + Domain (Body Small, text-secondary) + Tags (Badge ShadCN, max 3-4) + QuickPrompts (3 sugestões com emoji, Body Small) + CTA Button "Démarrer une conversation"
  - [ ] 6.4 Hover state: elevação (shadow-lg) + scale sutil (scale-[1.02]) com transition 150ms
  - [ ] 6.5 Card ShadCN como base com padding md (16px)
  - [ ] 6.6 CTA link para `/login` (MVP — requer autenticação para conversar)
  - [ ] 6.7 `role="article"` no card, `aria-label` descritivo no CTA
  - [ ] 6.8 Touch target do CTA mínimo 44x44px

- [ ] Task 7: Criar componente QuickPrompt (AC: #3)
  - [ ] 7.1 Criar `src/components/specialist/quick-prompt.tsx`
  - [ ] 7.2 Props: `prompt: string` (inclui emoji no início)
  - [ ] 7.3 Visual: texto com emoji, fundo surface, border sutil, border-radius md
  - [ ] 7.4 Hover: border accent + text accent
  - [ ] 7.5 Na landing page: apenas visual (não clicável) — mostra exemplos de perguntas
  - [ ] 7.6 `role="listitem"` quando dentro de lista

- [ ] Task 8: Criar Hero Section da Landing Page (AC: #1)
  - [ ] 8.1 Implementar hero split dentro de `src/app/(public)/page.tsx`
  - [ ] 8.2 Layout: grid 2 colunas (lg:grid-cols-2) — texto à esquerda, ChatHeroPreview à direita
  - [ ] 8.3 Texto: H1 "Votre expert IA, disponible 24h/24" (ou similar em francês), Body Large com proposta de valor, CTA primário "Découvrir nos experts" (âncora para seção catálogo), CTA secundário "Voir la démo"
  - [ ] 8.4 Max-width 1280px centrado, padding vertical 3xl (64px)
  - [ ] 8.5 Responsivo: tablet → hero empilhado (texto em cima, preview embaixo), mobile → texto apenas (preview oculto com `hidden lg:block`)
  - [ ] 8.6 Tipografia mobile: H1 scale down para 2rem

- [ ] Task 9: Criar Seção Catálogo de Especialistas (AC: #2, #3)
  - [ ] 9.1 Seção com id="specialists" para âncora do hero CTA
  - [ ] 9.2 H2 "Nos Experts IA" centrado
  - [ ] 9.3 Grid responsivo: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6`
  - [ ] 9.4 Fetch dos especialistas via Server Component: `prisma.specialist.findMany({ where: { isActive: true } })`
  - [ ] 9.5 Renderizar SpecialistCard para cada especialista
  - [ ] 9.6 Max-width 1280px centrado, padding vertical 2xl (48px)
  - [ ] 9.7 Empty state: mensagem "Nos experts arrivent bientôt..." se nenhum ativo

- [ ] Task 10: SEO e Metadata (AC: #6)
  - [ ] 10.1 Configurar `generateMetadata` no `src/app/(public)/page.tsx`
  - [ ] 10.2 Title: "ultra-ia | Votre Expert IA Spécialisé"
  - [ ] 10.3 Description: proposta de valor concisa em francês
  - [ ] 10.4 Open Graph: title, description, image (de `public/images/og/landing.webp`), type "website"
  - [ ] 10.5 Canonical URL via `NEXT_PUBLIC_APP_URL`
  - [ ] 10.6 Criar placeholder OG image em `public/images/og/landing.webp`
  - [ ] 10.7 Structured data JSON-LD (Organization schema) no layout ou page

- [ ] Task 11: Mobile Navigation (AC: #8)
  - [ ] 11.1 Criar `src/components/layout/mobile-nav.tsx` ou integrar no header
  - [ ] 11.2 Hamburger icon (< 1024px) usando DropdownMenu ou Sheet do ShadCN
  - [ ] 11.3 Menu overlay com nav links + CTA login + theme toggle
  - [ ] 11.4 Fechar ao clicar em link ou backdrop
  - [ ] 11.5 Animação de abertura/fecho suave (150ms)

- [ ] Task 12: Validação final (AC: #7, #8)
  - [ ] 12.1 Verificar FCP < 2s com Lighthouse (desenvolvimento local)
  - [ ] 12.2 Testar responsividade em todos os breakpoints: < 640px, 640-1024px, > 1024px, > 1280px
  - [ ] 12.3 Verificar dark/light mode no landing completo
  - [ ] 12.4 Verificar keyboard navigation (Tab order: skip link → header → hero → catalog → footer)
  - [ ] 12.5 Verificar `npm run lint` e `npx tsc --noEmit` sem erros
  - [ ] 12.6 Verificar Lighthouse Accessibility score > 95

## Dev Notes

### Pré-requisitos da Story 1.1

Esta story assume que a Story 1.1 foi completada com sucesso e os seguintes elementos já existem:
- Projeto Next.js 16.1 inicializado com TypeScript, Tailwind, App Router, ShadCN UI
- Design system configurado (CSS custom properties, cores, tipografia Poppins+Inter, next-themes)
- Prisma configurado com schema (incluindo modelo Specialist)
- Estrutura de pastas com route groups criados
- Root layout com ThemeProvider, Toaster
- Componentes ShadCN base instalados (Button, Card, Avatar, Badge, DropdownMenu, Skeleton, etc.)
- `src/lib/prisma.ts` (PrismaClient singleton)
- `src/lib/utils.ts` (cn() helper)

### Padrões de Arquitetura Obrigatórios

- **Rendering:** SSR via Server Components para a landing page inteira (SEO). Apenas ChatHeroPreview é Client Component (animação)
- **Data Fetching:** Server Component faz query Prisma diretamente (sem API route para landing page)
- **API Response Pattern:** `{ success, data, error }` — mas para a landing page, dados são fetched via Server Component, sem API
- **Import Order:** React/Next → Libs externas → Components → Lib/utils → Types → Stores
- **Naming:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars)
- **Ficheiros componentes:** kebab-case.tsx (specialist-card.tsx, chat-hero-preview.tsx)
- **HTML Semântico:** `<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`, `<section>` — zero div-soup
- **Testes co-localizados:** `specialist-card.tsx` → `specialist-card.test.tsx`

### Modelo Specialist — Campos e Seed Data

```prisma
model Specialist {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  domain        String
  description   String   @db.Text
  price         Int      // em cêntimos (e.g., 9900 = €99)
  accentColor   String   // hex color (e.g., "#2563EB")
  avatarUrl     String
  tags          String[] // array de tags de expertise
  quickPrompts  String[] // array de sugestões
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  conversations Conversation[]
  subscriptions Subscription[]
  @@map("specialists")
  @@index([slug])
}
```

**Seed Data — Gestão Empresarial:**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.specialist.upsert({
    where: { slug: 'gestion-entreprise' },
    update: {},
    create: {
      name: 'Expert Gestion',
      slug: 'gestion-entreprise',
      domain: "Gestion d'Entreprise",
      description:
        "Expert IA spécialisé en gestion d'entreprise. Conseils personnalisés en stratégie, finance, RH et opérations pour PME et entrepreneurs.",
      price: 9900, // €99/mois
      accentColor: '#2563EB',
      avatarUrl: '/images/specialists/gestion-entreprise.webp',
      tags: ['Stratégie', 'Finance', 'RH', 'Opérations', 'PME'],
      quickPrompts: [
        "💼 Comment structurer mon business plan pour lever des fonds ?",
        "📊 Quels KPI suivre pour une PME de 10 employés ?",
        "🏗️ Comment optimiser mes processus opérationnels ?",
      ],
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Layout Responsivo da Landing Page

**Desktop (> 1024px):**
```
┌─────────────────────────────────────────────────┐
│ [Logo]    Spécialistes  Tarifs    [Se connecter] │  ← Header fixo, max-width 1280px
├─────────────────────────────────────────────────┤
│                                                  │
│  H1: Votre expert IA    │  ┌─────────────────┐  │  ← Hero split (grid 2 cols)
│  Body: proposta valor    │  │ ChatHeroPreview │  │
│  [CTA Primário]          │  │ (chat animado)  │  │
│  [CTA Secundário]        │  └─────────────────┘  │
│                                                  │
├─────────────────────────────────────────────────┤
│              H2: Nos Experts IA                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  ← Grid 3 colunas
│  │ Card 1   │  │ Card 2   │  │ Card 3   │      │
│  │ Avatar   │  │ Avatar   │  │ Avatar   │      │
│  │ Nome     │  │ Nome     │  │ Nome     │      │
│  │ Tags     │  │ Tags     │  │ Tags     │      │
│  │ Prompts  │  │ Prompts  │  │ Prompts  │      │
│  │ [CTA]    │  │ [CTA]    │  │ [CTA]    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
├─────────────────────────────────────────────────┤
│ [Logo] [Links úteis] [Links legais]             │  ← Footer
└─────────────────────────────────────────────────┘
```

**Tablet (640px - 1024px):**
- Hero: empilhado (texto em cima, ChatHeroPreview embaixo)
- Grid: 2 colunas
- Header: hamburger menu

**Mobile (< 640px):**
- Hero: texto apenas (ChatHeroPreview `hidden lg:block`)
- Grid: 1 coluna
- Header: hamburger menu
- Tipografia H1: 2rem (vs 2.25rem desktop)

### Componentes — Especificações Detalhadas

**SpecialistCard:**
| Propriedade | Valor |
|---|---|
| Base | Card ShadCN |
| Avatar | 80px, ring-2 com `accentColor` |
| Nome | H4 (1.25rem, Poppins 600) |
| Domain | Body Small (0.875rem, Inter, text-secondary) |
| Tags | Badge ShadCN (max 4), variant outline |
| Quick Prompts | 3 items, Body Small, emoji prefix |
| CTA | Button primário, full-width, "Démarrer une conversation" |
| Hover | shadow-lg + scale-[1.02], transition-all 150ms |
| Accessibility | role="article", CTA com aria-label |

**ChatHeroPreview:**
| Propriedade | Valor |
|---|---|
| Tipo | Client Component ("use client") |
| Frame | rounded-xl, shadow-2xl, border, bg-surface |
| Mensagens | 3-4 bolhas simuladas (user + AI) |
| Animação | Fade-in sequencial com delay, loop |
| Reduced Motion | Versão estática, todas mensagens visíveis |
| Accessibility | aria-hidden="true" (decorativo) |
| Cores bolhas | User: bg-primary/text-white | AI: bg-surface/text-primary |

**Header:**
| Propriedade | Valor |
|---|---|
| Position | sticky top-0 z-50 |
| Background | bg-background/80 backdrop-blur-sm |
| Max-width | 1280px centrado |
| Height | ~64px (h-16) |
| Nav | `<nav aria-label="Navigation principale">` |
| Mobile | Hamburger < 1024px (Sheet ou DropdownMenu ShadCN) |
| Skip link | Primeiro elemento: "Aller au contenu principal" |

**Footer:**
| Propriedade | Valor |
|---|---|
| Background | bg-surface (light) / bg-surface (dark) |
| Max-width | 1280px centrado |
| Estrutura | 3 colunas: Marca + Links úteis + Legal |
| Links legais | /privacy, /terms |
| Copyright | "© 2026 ultra-ia. Tous droits réservés." |

### Cores e Espaçamento Específicos da Landing

- **Seções:** padding vertical 2xl (48px) a 3xl (64px) entre blocos
- **Gap do grid cards:** gap-6 (24px)
- **Padding lateral container:** 24px (desktop) / 16px (mobile) → `px-4 lg:px-6`
- **Hero:** padding vertical 3xl (64px)
- **Catálogo:** padding vertical 2xl (48px)
- **Light mode como padrão** para landing page (modo premium/confiança)
- **Specialist accent color:** #2563EB (azul confiança) — aparece no avatar ring e detalhes do card

### SEO — Implementação

```typescript
// src/app/(public)/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ultra-ia | Votre Expert IA Spécialisé',
  description:
    'Accédez à des experts IA spécialisés disponibles 24h/24. Conseils personnalisés en gestion, finance, RH et plus encore.',
  openGraph: {
    title: 'ultra-ia | Votre Expert IA Spécialisé',
    description:
      'Accédez à des experts IA spécialisés disponibles 24h/24.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'ultra-ia',
    images: [{ url: '/images/og/landing.webp', width: 1200, height: 630 }],
    type: 'website',
    locale: 'fr_FR',
  },
};
```

**Structured Data (JSON-LD):**

```typescript
// Adicionar no page.tsx ou layout.tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ultra-ia',
  url: process.env.NEXT_PUBLIC_APP_URL,
  description: 'Experts IA spécialisés disponibles 24h/24',
  logo: `${process.env.NEXT_PUBLIC_APP_URL}/images/og/landing.webp`,
};

// No JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### Tipografia na Landing

| Elemento | Nível | Desktop | Mobile (< 640px) |
|----------|-------|---------|-------------------|
| Hero título | H1 | 2.25rem (36px), Poppins 700 | 2rem (32px) |
| Hero body | Body Large | 1.125rem (18px), Inter 400 | 1rem (16px) |
| Seção título | H2 | 1.875rem (30px), Poppins 600 | 1.5rem (24px) |
| Card nome | H4 | 1.25rem (20px), Poppins 600 | — |
| Card domain | Body Small | 0.875rem (14px), Inter 400 | — |
| Card prompts | Body Small | 0.875rem (14px), Inter 400 | — |
| Footer | Body Small | 0.875rem (14px), Inter 400 | — |

### Animação do ChatHeroPreview

```typescript
// Mensagens simuladas (em francês)
const mockMessages = [
  { role: 'user', content: "Comment améliorer la rentabilité de ma PME ?" },
  { role: 'assistant', content: "Avant de vous conseiller, j'ai quelques questions pour comprendre votre situation :" },
  { role: 'assistant', content: "📊 Quel est votre chiffre d'affaires annuel ?\n👥 Combien d'employés avez-vous ?\n🏭 Quel est votre secteur d'activité ?" },
  { role: 'user', content: "500K€, 8 employés, services B2B" },
  { role: 'assistant', content: "Excellent ! Voici 3 leviers prioritaires pour votre profil..." },
];

// Timing: cada mensagem aparece com 1.5s de delay
// Loop: reinicia após 3s de pausa no final
// prefers-reduced-motion: mostra todas as mensagens de uma vez
```

### Dependências Adicionais Nesta Story

```bash
# Seed execution
npm install -D tsx

# Nenhuma outra dependência necessária — ShadCN components e next-themes já instalados na Story 1.1
```

### Project Structure Notes

**Ficheiros a criar nesta story:**
```
src/
├── app/(public)/
│   ├── layout.tsx                  # IMPLEMENTAR (era placeholder)
│   └── page.tsx                    # IMPLEMENTAR (era placeholder)
├── components/
│   ├── specialist/
│   │   ├── specialist-card.tsx     # NOVO
│   │   ├── quick-prompt.tsx        # NOVO
│   │   └── chat-hero-preview.tsx   # NOVO
│   └── layout/
│       ├── header.tsx              # NOVO
│       ├── footer.tsx              # NOVO
│       └── mobile-nav.tsx          # NOVO (ou integrado no header)
prisma/
│   └── seed.ts                     # IMPLEMENTAR (era placeholder)
public/
├── images/
│   ├── specialists/
│   │   └── gestion-entreprise.webp # NOVO (placeholder)
│   └── og/
│       └── landing.webp            # NOVO (placeholder)
```

**Ficheiros existentes da Story 1.1 que serão modificados:**
- Nenhum — esta story cria novos ficheiros e implementa os placeholders

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar autenticação — o CTA "Se connecter" é apenas um `<Link href="/login">`, a página /login será criada na Story 2.1
- **NÃO** implementar funcionalidade de chat real — o ChatHeroPreview é uma animação decorativa com dados mockados
- **NÃO** implementar routing para página individual do especialista — será Story 1.3
- **NÃO** criar API routes — a landing page busca dados via Server Component diretamente do Prisma
- **NÃO** implementar páginas legais (/privacy, /terms) — links existem no footer mas páginas serão Story 1.4
- **NÃO** instalar dependências de stories futuras (zustand, swr, zod, react-hook-form)
- **NÃO** usar `useEffect` para data fetching — usar Server Components
- **NÃO** usar `<img>` — usar `next/image` com `Image` component
- **NÃO** esquecer `alt` text nas imagens/avatares
- **NÃO** usar `focus:` — usar `focus-visible:` para indicadores de foco
- **NÃO** esquecer `prefers-reduced-motion` no ChatHeroPreview

### Emotional Design — Landing Page

| Momento | Emoção Desejada | Como o Design Suporta |
|---------|----------------|----------------------|
| Descoberta (hero) | Curiosidade + Credibilidade | Visual premium, chat preview animado mostrando personalização |
| Exploração (catálogo) | Confiança + Interesse | Cards profissionais, tags de expertise, sugestões concretas |
| Decisão (CTA) | Urgência suave | CTA claro "Démarrer une conversation", proposta de valor visível |

**Princípio chave:** "Show don't tell" — a demo de chat no hero é mais convincente que texto descritivo. O visitante vê a interação personalizada antes de decidir.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.2 Acceptance Criteria, Epic 1 Overview]
- [Source: _bmad-output/planning-artifacts/architecture.md — Public Route Group, Specialist Model, SSR Strategy, Component Structure, API Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Landing Page Layout, Hero Split, SpecialistCard Anatomy, ChatHeroPreview, Responsive Breakpoints, Typography, Spacing, CTA Hierarchy, Accessibility]
- [Source: _bmad-output/planning-artifacts/prd.md — FR1 (Catálogo de Especialistas), FR2 (Página de Descoberta), NFR2 (FCP < 2s)]
- [Source: _bmad-output/implementation-artifacts/1-1-inicializacao-do-projeto-design-system.md — Previous Story Context, Design System Specs, Folder Structure]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide for landing page created
- Story includes seed data, complete component specs, responsive ASCII mockup, SEO implementation, animation details
- Guardrails prevent scope creep: no auth, no real chat, no specialist detail page, no legal pages
- Previous story (1.1) context integrated: all design system tokens, folder structure, component patterns referenced
- French language interface: all user-facing text in French (MVP)

### File List
