# Story 1.3: Página Pública do Especialista

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitor**,
I want **to see detailed information about a specific specialist**,
so that **I can evaluate the specialist's expertise and decide if the service is worth subscribing to**.

## Acceptance Criteria

1. **Given** um visitante clica no card de um especialista na landing page **When** a página do especialista carrega (`/specialist/[slug]`) **Then** o perfil completo é exibido: avatar grande com cor de acento, nome, título, descrição detalhada do domínio, tags de expertise
2. **And** sugestões de perguntas clicáveis (QuickPrompt components) são exibidas com emoji
3. **And** o preço da assinatura (~99€/mois) é claramente visível
4. **And** um CTA proeminente "Démarrer une conversation" redireciona para signup/login
5. **And** a página é renderizada via SSR para SEO (meta tags, Open Graph)
6. **And** a página é responsiva (card centralizado max-width 720px desktop, full-width mobile)
7. **And** acessibilidade: `role="article"`, alt text no avatar, link semântico no CTA

## Tasks / Subtasks

- [ ] Task 1: Criar página dinâmica do especialista (AC: #1, #5, #6)
  - [ ] 1.1 Criar `src/app/(public)/specialist/[slug]/page.tsx` como Server Component
  - [ ] 1.2 Implementar data fetching via Prisma diretamente no Server Component: `prisma.specialist.findUnique({ where: { slug, isActive: true } })`
  - [ ] 1.3 Implementar `generateMetadata()` com título, descrição, Open Graph dinâmicos baseados nos dados do especialista
  - [ ] 1.4 Implementar `generateStaticParams()` para pré-gerar páginas de especialistas ativos no build
  - [ ] 1.5 Tratar caso de especialista não encontrado: `notFound()` do Next.js
  - [ ] 1.6 Layout: card centralizado max-width 720px com `mx-auto` e padding responsivo

- [ ] Task 2: Criar componente SpecialistProfile (AC: #1, #3)
  - [ ] 2.1 Criar `src/components/specialist/specialist-profile.tsx` (Server Component)
  - [ ] 2.2 Props: `specialist: Specialist` (type completo do Prisma)
  - [ ] 2.3 Layout vertical: Avatar (120px, ring-4 com accentColor) → Nome (H1, Poppins 700) → Domain (H3, text-secondary) → Descrição (Body Large, Inter 400) → Preço → Tags → Quick Prompts → CTA
  - [ ] 2.4 Seção de preço: "99 €/mois" formatado com destaque (H3, font-semibold), texto auxiliar "Accès illimité à l'expert"
  - [ ] 2.5 Tags de expertise: Badge ShadCN (variant outline), layout flex wrap, gap sm (8px)
  - [ ] 2.6 `role="article"` no container principal
  - [ ] 2.7 Avatar com `next/image`, `alt="{name} - Expert {domain}"`, priority loading

- [ ] Task 3: Adaptar QuickPrompt para specialist page (AC: #2)
  - [ ] 3.1 Reutilizar `src/components/specialist/quick-prompt.tsx` da Story 1.2
  - [ ] 3.2 Na specialist page: QuickPrompts são clicáveis — ao clicar, redirecionar para `/login?specialist={slug}&prompt={encodedPrompt}` (pre-fill da primeira mensagem após login)
  - [ ] 3.3 Layout: grid 1 coluna no desktop (max-width 720px dá espaço), scroll horizontal no mobile (< 640px)
  - [ ] 3.4 Hover: border accent + text accent (transição 150ms)
  - [ ] 3.5 `role="button"`, `aria-label` descritivo ("Poser la question: {prompt text}")
  - [ ] 3.6 Cursor pointer para indicar clicabilidade

- [ ] Task 4: Implementar CTA principal (AC: #4)
  - [ ] 4.1 Button primário full-width: "Démarrer une conversation" com ícone seta
  - [ ] 4.2 Link para `/login?specialist={slug}` (MVP — requer autenticação)
  - [ ] 4.3 Estilo: bg-primary, texto branco, h-12 (48px), border-radius 12px, font-semibold
  - [ ] 4.4 Hover: bg-primary-hover (#1D4ED8), transition 150ms
  - [ ] 4.5 Touch target: mínimo 44x44px (garantido pelo h-12)
  - [ ] 4.6 `aria-label="Démarrer une conversation avec {name}"`

- [ ] Task 5: SEO — Metadata dinâmica e Structured Data (AC: #5)
  - [ ] 5.1 `generateMetadata()`:
    - title: `"{name} - Expert {domain} | ultra-ia"`
    - description: primeiros 160 chars da descrição do especialista
    - openGraph: title, description, image (avatar ou OG fallback), type "profile"
    - canonical: `{NEXT_PUBLIC_APP_URL}/specialist/{slug}`
  - [ ] 5.2 Structured Data JSON-LD (Person ou ProfessionalService schema):
    ```json
    { "@context": "https://schema.org", "@type": "ProfessionalService", "name": "{name}", "description": "{domain}", "url": "..." }
    ```
  - [ ] 5.3 Adicionar script JSON-LD no page component

- [ ] Task 6: Implementar cache com unstable_cache (AC: #5, performance)
  - [ ] 6.1 Wrapper de cache para query do especialista:
    ```typescript
    const getSpecialist = unstable_cache(
      (slug: string) => prisma.specialist.findUnique({ where: { slug, isActive: true } }),
      ['specialist'],
      { revalidate: 3600, tags: ['specialist'] }
    );
    ```
  - [ ] 6.2 Revalidação a cada 1 hora (3600s) — dados do especialista raramente mudam
  - [ ] 6.3 Tag-based revalidation para updates futuros via admin

- [ ] Task 7: Atualizar SpecialistCard na landing page (link para specialist page) (AC: #1)
  - [ ] 7.1 No `specialist-card.tsx` da Story 1.2: alterar CTA de `href="/login"` para `href="/specialist/{slug}"`
  - [ ] 7.2 CTA text: manter "Démarrer une conversation" mas agora leva à página do especialista primeiro
  - [ ] 7.3 Ou: adicionar link no card inteiro (card clicável) + CTA separado

- [ ] Task 8: Breadcrumb / Back navigation (navegação contextual)
  - [ ] 8.1 Adicionar link de retorno "← Nos Experts" no topo da página do especialista
  - [ ] 8.2 Link para `/` (landing page, seção catálogo)
  - [ ] 8.3 Estilo: text-secondary, hover text-primary, Body Small

- [ ] Task 9: Responsividade e Dark Mode (AC: #6)
  - [ ] 9.1 Desktop (> 1024px): card centralizado max-width 720px
  - [ ] 9.2 Tablet (640px - 1024px): card full-width com padding lateral 24px
  - [ ] 9.3 Mobile (< 640px): card full-width, padding 16px, quick prompts em scroll horizontal
  - [ ] 9.4 Tipografia mobile: H1 scale down para 2rem, Body Large para 1rem
  - [ ] 9.5 Dark mode: testar todas as cores (surface, text, borders, accent color) nos dois modos
  - [ ] 9.6 Avatar: responsivo (120px desktop, 96px mobile)

- [ ] Task 10: Validação final (AC: #7)
  - [ ] 10.1 Verificar acessibilidade: role="article", alt text, aria-labels, focus-visible
  - [ ] 10.2 Verificar keyboard navigation: Tab → back link → quick prompts → CTA
  - [ ] 10.3 Testar com `npm run lint` e `npx tsc --noEmit` sem erros
  - [ ] 10.4 Verificar SSR: view-source mostra conteúdo renderizado (SEO)
  - [ ] 10.5 Verificar Lighthouse Accessibility > 95
  - [ ] 10.6 Testar URL `/specialist/gestion-entreprise` com seed data da Story 1.2

## Dev Notes

### Pré-requisitos das Stories 1.1 e 1.2

Esta story assume que as Stories 1.1 e 1.2 foram completadas:

**Da Story 1.1:**
- Projeto Next.js 16.1 com TypeScript, Tailwind, ShadCN, Prisma
- Design system (CSS custom properties, cores, tipografia, next-themes)
- Estrutura de pastas com route groups
- Componentes ShadCN base (Button, Card, Avatar, Badge, Skeleton)
- `src/lib/prisma.ts` (PrismaClient singleton)

**Da Story 1.2:**
- Modelo Specialist no Prisma com todos os campos (seed data "Gestão Empresarial")
- Public layout `(public)/layout.tsx` com Header + Footer
- Componentes: `specialist-card.tsx`, `quick-prompt.tsx`, `chat-hero-preview.tsx`
- Header e Footer implementados
- Landing page com catálogo de cards que linkam para `/specialist/[slug]`

### Padrões de Arquitetura Obrigatórios

- **Rendering:** SSR via Server Component (SEO). Sem Client Components nesta story (sem interatividade complexa)
- **Data Fetching:** Server Component com Prisma direto + `unstable_cache` para performance
- **Cache:** ISR com `revalidate: 3600` (1h), `generateStaticParams()` para pré-geração
- **API Response Pattern:** Não se aplica — dados fetched via Server Component direto, sem API route
- **Import Order:** React/Next → Libs externas → Components → Lib/utils → Types → Stores
- **Naming:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars)
- **HTML Semântico:** `<article>` para o perfil, `<section>` para seções, `<h1>` para nome

### Layout da Página — Specialist Profile

```
┌─────────────────────────────────────────────────┐
│  Header (herdado do public layout)               │
├─────────────────────────────────────────────────┤
│  ← Nos Experts                                   │  ← Back link
│                                                  │
│         ┌──────────────────────┐                 │
│         │     Avatar (120px)   │                 │  ← ring-4 accentColor
│         │   com cor de acento  │                 │
│         └──────────────────────┘                 │
│                                                  │
│            Expert Gestion                        │  ← H1, Poppins 700
│         Gestion d'Entreprise                     │  ← H3, text-secondary
│                                                  │
│  Expert IA spécialisé en gestion                 │  ← Body Large, Inter
│  d'entreprise. Conseils personnalisés            │
│  en stratégie, finance, RH et opérations...      │
│                                                  │
│  ┌──────┐  ┌─────────┐  ┌────┐  ┌──────────┐   │
│  │Strat.│  │ Finance │  │ RH │  │Opérations│   │  ← Tags (Badge)
│  └──────┘  └─────────┘  └────┘  └──────────┘   │
│                                                  │
│            99 €/mois                             │  ← H3, font-semibold
│      Accès illimité à l'expert                   │  ← Caption, text-secondary
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ 💼 Comment structurer mon business      │    │  ← QuickPrompt (clicável)
│  │    plan pour lever des fonds ?           │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ 📊 Quels KPI suivre pour une PME       │    │
│  │    de 10 employés ?                      │    │
│  └─────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────┐    │
│  │ 🏗️ Comment optimiser mes processus     │    │
│  │    opérationnels ?                       │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │   Démarrer une conversation →           │    │  ← CTA primário, full-width
│  └─────────────────────────────────────────┘    │
│                                                  │
├─────────────────────────────────────────────────┤
│  Footer (herdado do public layout)               │
└─────────────────────────────────────────────────┘
```

**Desktop:** max-width 720px, centrado (`mx-auto`)
**Tablet:** full-width, padding lateral 24px (`px-6`)
**Mobile:** full-width, padding 16px (`px-4`), quick prompts scroll horizontal

### Data Fetching Pattern

```typescript
// src/app/(public)/specialist/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { SpecialistProfile } from '@/components/specialist/specialist-profile';

const getSpecialist = unstable_cache(
  async (slug: string) => {
    return prisma.specialist.findUnique({
      where: { slug, isActive: true },
    });
  },
  ['specialist'],
  { revalidate: 3600, tags: ['specialist'] }
);

// generateStaticParams for ISR pre-generation
export async function generateStaticParams() {
  const specialists = await prisma.specialist.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return specialists.map((s) => ({ slug: s.slug }));
}

// generateMetadata for dynamic SEO
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const specialist = await getSpecialist(params.slug);
  if (!specialist) return {};
  return {
    title: `${specialist.name} - Expert ${specialist.domain} | ultra-ia`,
    description: specialist.description.slice(0, 160),
    openGraph: {
      title: `${specialist.name} - Expert ${specialist.domain}`,
      description: specialist.description.slice(0, 160),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/specialist/${specialist.slug}`,
      images: [{ url: specialist.avatarUrl, width: 400, height: 400 }],
      type: 'profile',
    },
  };
}

export default async function SpecialistPage({ params }: { params: { slug: string } }) {
  const specialist = await getSpecialist(params.slug);
  if (!specialist) notFound();
  return <SpecialistProfile specialist={specialist} />;
}
```

### SEO — Structured Data JSON-LD

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: specialist.name,
  description: specialist.description,
  url: `${process.env.NEXT_PUBLIC_APP_URL}/specialist/${specialist.slug}`,
  image: specialist.avatarUrl,
  priceRange: '99€/mois',
  areaServed: { '@type': 'Place', name: 'France' },
};
```

### Responsividade — Quick Prompts

```
Desktop (> 640px):           Mobile (< 640px):
┌────────────────────┐      ┌────────┐ ┌────────┐ ┌────────┐
│ 💼 Business plan?  │      │💼 Biz  │ │📊 KPIs │ │🏗️ Proc│ → scroll
└────────────────────┘      └────────┘ └────────┘ └────────┘
┌────────────────────┐
│ 📊 Quels KPI...   │      ← vertical stack    ← horizontal scroll
└────────────────────┘
┌────────────────────┐
│ 🏗️ Optimiser...   │
└────────────────────┘
```

### Formatação de Preço

```typescript
// Formatar preço em cêntimos para euros
function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(priceInCents / 100);
}
// 9900 → "99 €"
```

### Componentes Reutilizados da Story 1.2

| Componente | Localização | Uso nesta Story |
|---|---|---|
| `QuickPrompt` | `components/specialist/quick-prompt.tsx` | Reutilizado — agora clicável (vs visual-only na landing) |
| `Badge` (ShadCN) | `components/ui/badge.tsx` | Tags de expertise |
| `Button` (ShadCN) | `components/ui/button.tsx` | CTA primário |
| `Avatar` (ShadCN) | `components/ui/avatar.tsx` | Avatar do especialista (versão grande) |
| `Header` | `components/layout/header.tsx` | Via public layout (herdado) |
| `Footer` | `components/layout/footer.tsx` | Via public layout (herdado) |

### Ficheiros a Criar/Modificar

```
NOVOS:
src/app/(public)/specialist/[slug]/page.tsx          # Página do especialista
src/components/specialist/specialist-profile.tsx      # Profile component

MODIFICADOS:
src/components/specialist/specialist-card.tsx         # CTA link → /specialist/[slug]
src/components/specialist/quick-prompt.tsx            # Adicionar prop onClick/href (clicável)
```

### Design Emocional — Specialist Page

| Momento | Emoção Desejada | Como o Design Suporta |
|---------|----------------|----------------------|
| Exploração (perfil) | Confiança + Credibilidade | Avatar profissional, credenciais visíveis, tags de expertise |
| Avaliação (prompts) | Curiosidade + Relevância | Quick prompts mostram o tipo de ajuda concreta disponível |
| Decisão (preço + CTA) | Confiança + Urgência suave | Preço claro, CTA proeminente, sem surpresas |

**Princípio:** Perfil do especialista como âncora — o usuário volta para "seu" consultor, não para "a plataforma". Cada especialista tem identidade visual própria (accentColor) dentro do sistema coeso.

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar autenticação — o CTA redireciona para `/login` (Story 2.1)
- **NÃO** implementar chat — esta é uma página informacional de descoberta
- **NÃO** criar API route para specialist — dados são fetched via Server Component direto
- **NÃO** implementar pagamento — o preço é informativo, checkout será Story 3.1
- **NÃO** implementar páginas legais (/privacy, /terms) — serão Story 1.4
- **NÃO** usar `useEffect` ou `useState` — esta página é 100% Server Component
- **NÃO** usar `<img>` — usar `next/image` com `Image`
- **NÃO** esquecer `alt` text no avatar
- **NÃO** usar px para font-size — usar rem
- **NÃO** duplicar o componente SpecialistCard — criar variante Profile separada
- **NÃO** esquecer `notFound()` quando slug não existe

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.3 Acceptance Criteria, Epic 1 Overview, Cross-Story Dependencies]
- [Source: _bmad-output/planning-artifacts/architecture.md — Public Route Group, Specialist Model, SSR/ISR Patterns, unstable_cache, generateStaticParams, API Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — SpecialistCard Profile Variant, QuickPrompt Component, Responsive Layout (720px max-width), Typography, Spacing, Dark/Light Mode, Accessibility]
- [Source: _bmad-output/planning-artifacts/prd.md — FR6-FR11 (Specialist Public Page), NFR2 (Performance)]
- [Source: _bmad-output/implementation-artifacts/1-1-inicializacao-do-projeto-design-system.md — Design System Foundation]
- [Source: _bmad-output/implementation-artifacts/1-2-landing-page-com-catalogo-de-especialistas.md — SpecialistCard, QuickPrompt, Header, Footer, Seed Data]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide for specialist page
- Story includes complete data fetching pattern with unstable_cache, generateStaticParams, generateMetadata
- ASCII mockup of specialist profile layout with responsive variants
- Reutiliza componentes da Story 1.2 (QuickPrompt, Badge, Avatar, Header, Footer)
- QuickPrompt evolui: visual-only (landing) → clicável (specialist page) com redirect para login
- Guardrails: sem auth, sem chat, sem pagamento, sem API route
- Structured data JSON-LD para SEO
- Price formatting helper para conversão cêntimos → euros (fr-FR locale)

### File List
