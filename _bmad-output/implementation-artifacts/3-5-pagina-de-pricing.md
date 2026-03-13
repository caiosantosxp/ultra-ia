# Story 3.5: Página de Pricing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitor**,
I want **to see clear pricing information**,
so that **I can understand the cost before creating an account**.

## Acceptance Criteria

1. **Given** um visitante acessa `/pricing` **When** a página carrega **Then** o plano de assinatura é exibido com valor ~99€/mês por especialista
2. **And** os benefícios incluídos estão listados: acesso 24/7, perguntas ilimitadas dentro do limite diário, histórico de conversas
3. **And** CTA "Commencer" redireciona para `/register` (signup)
4. **And** FAQ sobre pagamento, cancelamento e reembolso está disponível na página
5. **And** a página é renderizada via SSR para SEO (meta tags, Open Graph)
6. **And** o FCP é inferior a 2 segundos (NFR2)
7. **And** a página é responsiva em todos os breakpoints (mobile, tablet, desktop)
8. **And** a página suporta dark/light mode (herda do ThemeProvider do root layout)
9. **And** keyboard navigation e WCAG 2.1 AA são respeitados

## Tasks / Subtasks

- [x] Task 1: Criar a página SSR de pricing (AC: #1, #2, #3, #5, #6, #7, #8)
  - [x] 1.1 Criar `src/app/(public)/pricing/page.tsx` como Server Component
  - [x] 1.2 Configurar `export const metadata` com título, description e Open Graph em francês:
    ```typescript
    export const metadata: Metadata = {
      title: 'Tarifs | ultra-ia',
      description: 'Accédez à votre expert IA pour 99€/mois. Annulation à tout moment.',
      openGraph: {
        title: 'Tarifs | ultra-ia',
        description: 'Expert IA spécialisé disponible 24h/24 pour 99€/mois.',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        siteName: 'ultra-ia',
        type: 'website',
        locale: 'fr_FR',
      },
    };
    ```
  - [x] 1.3 Implementar hero section da pricing page: H1 "Tarifs simples et transparents", subtítulo com proposta de valor
  - [x] 1.4 Criar card de pricing principal com: valor 99€/mês em destaque, período de cobrança mensal, lista de benefícios com ícones (checkmark)
  - [x] 1.5 CTA Button primário "Commencer" → `<Link href="/register">`, full-width no mobile
  - [x] 1.6 Nota sob o CTA: "Annulation à tout moment. Aucun engagement." para reduzir fricção
  - [x] 1.7 Usar `process.env.NEXT_PUBLIC_APP_URL` para URLs canônicas no metadata (via APP_URL de @/lib/constants)

- [x] Task 2: Seção de benefícios detalhados (AC: #2)
  - [x] 2.1 Listar benefícios incluídos no plano:
    - ✅ Accès 24h/24, 7j/7 à votre expert IA
    - ✅ Questions illimitées (dans la limite journalière)
    - ✅ Historique complet de vos conversations
    - ✅ Réponses personnalisées selon votre contexte
    - ✅ Expert spécialisé dans votre domaine
  - [x] 2.2 Usar ícones do Lucide React (já instalado via ShadCN) — `CheckCircle` em `text-primary`
  - [x] 2.3 Layout: lista com espaçamento adequado, Body font (Inter), legível em mobile

- [x] Task 3: Seção FAQ (AC: #4)
  - [x] 3.1 Implementar FAQ com `Accordion` do ShadCN (`src/components/ui/accordion.tsx`)
  - [x] 3.2 Instalar o componente Accordion se não existir: `npx shadcn@latest add accordion`
  - [x] 3.3 Perguntas e respostas do FAQ (em francês):
    - **Comment fonctionne le paiement ?** → Paiement sécurisé via Stripe. Votre carte est débitée mensuellement.
    - **Puis-je annuler à tout moment ?** → Oui, vous pouvez annuler depuis votre espace "Facturation". L'accès reste actif jusqu'à la fin de la période payée.
    - **Y a-t-il un engagement ?** → Aucun engagement. Abonnement mensuel résiliable à tout moment.
    - **Que se passe-t-il si je rate un paiement ?** → Vous bénéficiez d'une période de grâce. Nous vous contactons pour régulariser avant toute interruption.
    - **Les données de ma conversation sont-elles sécurisées ?** → Oui, vos conversations sont chiffrées et vous pouvez demander leur suppression à tout moment (RGPD).
  - [x] 3.4 FAQ com `multiple={false}` (base-ui equiv. de single+collapsible) para acessibilidade
  - [x] 3.5 `<section aria-labelledby="faq-heading">` com `<h2 id="faq-heading">Questions fréquentes</h2>`

- [x] Task 4: Adicionar link "Tarifs" no Header (AC: #3)
  - [x] 4.1 Verificar `src/components/layout/header.tsx` — adicionar link "Tarifs" apontando para `/pricing` no nav
  - [x] 4.2 Adicionar no mobile nav `src/components/layout/mobile-nav.tsx` também
  - [x] 4.3 Destacar link como ativo quando na rota `/pricing` usando `usePathname()` (hook Next.js) — via DesktopNavLinks client component

- [x] Task 5: Layout responsivo e acessibilidade (AC: #7, #8, #9)
  - [x] 5.1 Layout: max-width 1280px centrado, padding lateral `px-4 lg:px-6`
  - [x] 5.2 Card de pricing: max-width 400px centrado no desktop, full-width no mobile
  - [x] 5.3 Verificar dark mode: card com `bg-card` e `text-card-foreground` do design system
  - [x] 5.4 Testar keyboard navigation: Tab order lógico hero → card → CTA → FAQ
  - [x] 5.5 CTA Button com touch target mínimo 44x44px (`min-h-[44px]`)
  - [x] 5.6 Verificar `npm run lint` e `npx tsc --noEmit` sem erros — ambos passaram

## Dev Notes

### Pré-requisitos das Stories Anteriores

Esta story assume que as seguintes stories foram completadas:
- **Story 1.1 ✅** — Design system, ShadCN, Poppins/Inter, ThemeProvider, `cn()` helper
- **Story 1.2 ✅** — Public layout (`src/app/(public)/layout.tsx`) com Header e Footer já implementados
- **Story 2.1 (in-progress)** — A rota `/register` será criada aqui; o CTA pode apontar para `/register` mesmo antes da story estar concluída (link apenas)

### Padrões de Arquitetura Obrigatórios

- **Rendering:** SSR via Server Component — a página inteira é um Server Component (sem `"use client"`)
- **Route Group:** `(public)` → herda automaticamente o public layout (Header + Footer)
- **Data:** Nenhuma query Prisma necessária — pricing é estático no MVP. O preço (9900 cents = €99) está no model Specialist mas não é necessário fetchá-lo aqui
- **Import Order:**
  1. React/Next.js
  2. Bibliotecas externas (Lucide)
  3. Components internos (@/components/ui/...)
  4. Lib/utils (@/lib/utils)
  5. Types
- **Naming:** `pricing/page.tsx` (kebab-case), Server Component (sem prefix)
- **Sem API routes** — página estática, sem chamadas a APIs nesta story

### Localização e Linguagem

- **Toda a interface em francês** (MVP — mercado europeu)
- Formatação de preço: `99€/mois` (não `€99/month`)
- Datas e textos legais em francês padrão
- Não usar `date-fns` nesta página (sem datas dinâmicas)

### Componentes ShadCN Usados

| Componente | Disponível | Origem |
|---|---|---|
| `Button` | ✅ Instalado na Story 1.1 | `src/components/ui/button.tsx` |
| `Card, CardHeader, CardContent` | ✅ Instalado na Story 1.1 | `src/components/ui/card.tsx` |
| `Accordion, AccordionItem, AccordionTrigger, AccordionContent` | ❓ Verificar | `src/components/ui/accordion.tsx` |
| `Badge` | ✅ Instalado na Story 1.1 | `src/components/ui/badge.tsx` |

**Se Accordion não estiver instalado:**
```bash
npx shadcn@latest add accordion
```

### Layout Visual da Pricing Page

```
┌─────────────────────────────────────────────────┐
│ [Logo]   Spécialistes  Tarifs   [Se connecter]  │  ← Header (existente)
├─────────────────────────────────────────────────┤
│                                                  │
│     H1: Tarifs simples et transparents           │  ← Hero Section
│     Subtítulo: votre expert IA pour 99€/mois     │
│                                                  │
│          ┌──────────────────────┐                │
│          │   Expert IA          │                │  ← Pricing Card (max-w-400px)
│          │   99€ /mois          │                │
│          │   ────────────────   │                │
│          │ ✅ Accès 24h/24      │                │
│          │ ✅ Questions illim.  │                │
│          │ ✅ Historique        │                │
│          │ ✅ Réponses perso.   │                │
│          │ ✅ Expert spécialisé │                │
│          │                      │                │
│          │  [Commencer →]       │                │
│          │  Sans engagement     │                │
│          └──────────────────────┘                │
│                                                  │
│     H2: Questions fréquentes                     │  ← FAQ Accordion
│     ▶ Comment fonctionne le paiement ?           │
│     ▶ Puis-je annuler à tout moment ?            │
│     ▶ Y a-t-il un engagement ?                   │
│     ▶ Que se passe-t-il si...                    │
│     ▶ Les données sont-elles sécurisées ?        │
│                                                  │
├─────────────────────────────────────────────────┤
│ [Logo] [Links úteis] [Links legais]             │  ← Footer (existente)
└─────────────────────────────────────────────────┘
```

**Mobile (< 640px):**
- Card pricing: full-width com padding
- CTA: full-width
- FAQ: accordion colapsável (boa UX em mobile)
- Header: hamburger menu

### Implementação do Card de Pricing

```typescript
// src/app/(public)/pricing/page.tsx
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const benefits = [
  "Accès 24h/24, 7j/7 à votre expert IA",
  "Questions illimitées (dans la limite journalière)",
  "Historique complet de vos conversations",
  "Réponses personnalisées selon votre contexte",
  "Expert spécialisé dans votre domaine",
];
```

### Implementação do FAQ com Accordion

```typescript
// src/app/(public)/pricing/page.tsx (continuação)
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "Comment fonctionne le paiement ?",
    answer: "Paiement sécurisé via Stripe. Votre carte est débitée mensuellement au même jour.",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer: "Oui, depuis votre espace \"Facturation\". L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    question: "Y a-t-il un engagement ?",
    answer: "Aucun engagement. Abonnement mensuel résiliable à tout moment sans frais.",
  },
  {
    question: "Que se passe-t-il si je rate un paiement ?",
    answer: "Vous bénéficiez d'une période de grâce. Nous vous contactons avant toute interruption de service.",
  },
  {
    question: "Les données de ma conversation sont-elles sécurisées ?",
    answer: "Oui, vos conversations sont chiffrées. Vous pouvez demander leur suppression à tout moment (conformité RGPD).",
  },
];
```

### Guardrails — O Que NÃO Fazer

- **NÃO** criar API routes para esta página — é completamente estática
- **NÃO** usar `"use client"` na página — Server Component puro para SSR
- **NÃO** implementar checkout Stripe nesta story — apenas o link para `/register`
- **NÃO** fetchar dados do banco para o preço — valor hardcoded 99€ no MVP
- **NÃO** criar componentes separados para pricing card ou FAQ nesta story — inline no `page.tsx` (uma única página simples)
- **NÃO** adicionar animações — página estática e performática
- **NÃO** usar `<img>` — se houver imagens usar `next/image`
- **NÃO** esquecer o `canonical` URL no metadata

### Relação com Outras Stories do Epic 3

| Story | Dependência | Direção |
|---|---|---|
| 3.1 Checkout | CTA "Commencer" → `/register` → checkout | Esta story linka para o fluxo que 3.1 implementa |
| 3.3 Subscription Gating | Usuários sem assinatura são redirecionados para /pricing ou /register | 3.3 pode linkar para esta página |
| 3.4 Billing | Usuários podem ver pricing antes de reativar | 3.4 pode linkar para esta página |
| 1.2 Landing Page | Header já tem "Tarifs" como nav link (Task 4 desta story confirma) | Dependência de layout ✅ |

### Project Structure Notes

**Arquivos a criar:**
```
src/
├── app/(public)/
│   └── pricing/
│       └── page.tsx          # NOVO — pricing page SSR
```

**Arquivos a modificar:**
```
src/components/layout/
├── header.tsx                 # MODIFICAR — adicionar link "Tarifs" ativo na nav
└── mobile-nav.tsx             # MODIFICAR — adicionar link "Tarifs" no menu mobile
```

**Componente ShadCN a verificar/instalar:**
```bash
# Verificar se existe primeiro:
# src/components/ui/accordion.tsx
# Se não existir:
npx shadcn@latest add accordion
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.5 Acceptance Criteria, Epic 3 Overview]
- [Source: _bmad-output/planning-artifacts/architecture.md — Public Route Group (`(public)/pricing/page.tsx`), SSR Strategy, Component Structure, API Patterns, Naming Conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — PricingSection component, Landing Page Layout, Emotional Design, Design Tokens, Typography]
- [Source: _bmad-output/implementation-artifacts/1-2-landing-page-com-catalogo-de-especialistas.md — Public Layout implementado, Header/Footer existentes, padrões SSR estabelecidos]
- [Source: _bmad-output/implementation-artifacts/3-3-subscription-gating-controle-de-acesso.md — Contexto do Epic 3, subscription states]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- base-ui Accordion usa `multiple` (não `openMultiple`) para controlar modo single — corrigido após erro de TypeScript
- Accordion instalado via `npx shadcn@latest add accordion` — precisou corrigir import order no arquivo gerado (lucide-react antes de @/lib/utils)
- Header é Server Component async: criado `DesktopNavLinks` client component para usePathname() no active state da nav desktop

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide for pricing page created
- Página estática SSR simples sem dependências de API ou banco de dados
- Reutiliza public layout (Header + Footer) da Story 1.2 sem modificações estruturais
- Accordion ShadCN instalado e usado para FAQ — `multiple={false}` para modo single (base-ui API)
- Task 4 modifica header.tsx e mobile-nav.tsx para link `/pricing` com active state via usePathname()
- CTA usa `buttonVariants` + `Link` (padrão do projeto para links que parecem botões)
- `APP_URL` de `@/lib/constants` usado para URLs canônicas no metadata (em vez de process.env direto)
- Lint e type-check passaram sem erros nos arquivos desta story
- Todos os ACs implementados e verificados

### File List

- src/app/(public)/pricing/page.tsx (NOVO)
- src/components/layout/nav-links.tsx (NOVO)
- src/components/ui/accordion.tsx (NOVO — instalado via shadcn)
- src/components/layout/header.tsx (MODIFICADO)
- src/components/layout/mobile-nav.tsx (MODIFICADO)

## Change Log

- 2026-03-12: Story implementada por Claude Sonnet 4.6 — Página de Pricing SSR criada com hero, pricing card, FAQ accordion, e link "Tarifs" ativo no header/mobile-nav
- 2026-03-12: Code review por Claude Sonnet 4.6 — 4 issues corrigidos (1 HIGH, 3 MEDIUM):
  - [H1] nav-links.tsx + mobile-nav.tsx: `#specialists` → `/#specialists` (link quebrado em /pricing)
  - [M1] pricing/page.tsx: adicionado `alternates.canonical` ao metadata (Guardrail violado)
  - [M2] mobile-nav.tsx: removido array `navLinks` duplicado, passa a importar de nav-links.tsx
  - [M3] pricing/page.tsx: corrigida ordem de imports (libs antes de componentes, `import type` por último)
