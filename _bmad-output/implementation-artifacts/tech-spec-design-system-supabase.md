---
title: 'Migração Design System → Supabase'
slug: 'design-system-supabase'
created: '2026-03-12'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Tailwind CSS 4', 'CSS Custom Properties', 'Next.js App Router', 'next/font/google (Inter)']
files_to_modify: ['src/app/globals.css', 'src/lib/fonts.ts', 'src/app/layout.tsx']
code_patterns: ['CSS custom properties via @theme inline', 'next/font with .variable CSS class', 'dark/light via .dark class (next-themes)']
test_patterns: ['visual — sem testes automatizados para design tokens']
---

# Tech-Spec: Migração Design System → Supabase

**Created:** 2026-03-12

## Overview

### Problem Statement

O design system atual usa paleta azul/slate genérica (`--primary: #2563EB`) com backgrounds slate que não reflete a identidade visual desejada. O objetivo é adotar o visual Supabase-like: verde como cor de marca, backgrounds quase-pretos (dark-first), tipografia Inter e bordas mais sutis.

### Solution

Substituir completamente os tokens CSS em `globals.css` (paleta de cores light + dark) e a configuração de fontes em `fonts.ts` + `layout.tsx` para seguir o design system do Supabase fielmente, sem reescrever os componentes ShadCN existentes.

### Scope

**In Scope:**
- Substituição completa dos tokens CSS em `src/app/globals.css` (`:root` light e `.dark`)
- Troca de tipografia: Geist Sans → Inter em `src/lib/fonts.ts` e `src/app/globals.css`
- Ajuste de `--radius` para o padrão Supabase (`0.375rem`)
- Atualização de `src/app/layout.tsx` para usar a nova fonte Inter e `themeColor` correto

**Out of Scope:**
- Reescrita de componentes ShadCN individuais (`button.tsx`, `card.tsx`, etc.)
- Alterações no schema do banco, lógica de negócio ou autenticação
- Novos componentes de UI
- Alterações em páginas ou layouts além dos tokens globais

## Context for Development

### Codebase Patterns

- Tailwind CSS 4 — sem `tailwind.config.js`. Tokens definidos em `globals.css` via `@theme inline` mapeando `var(--xxx)` CSS custom properties
- Dark/light mode via classe `.dark` (next-themes) — ambos os modos definidos em `globals.css`
- Fontes: `src/lib/fonts.ts` usa o pacote npm `geist` (não `next/font/google`). Expõe `.variable` CSS class que injeta a CSS var `--font-geist-sans`/`--font-geist-mono`
- `globals.css` `@theme inline` usa `--font-sans: var(--font-geist-sans)` — precisa trocar o nome da var quando trocar a fonte
- `layout.tsx` aplica as classes: `${geistSans.variable} ${geistMono.variable}` no `<body>` — padrão Next.js font variables
- Único import de `@/lib/fonts`: apenas `layout.tsx` — mudança isolada
- Referências a `geist-sans`/`geist-mono` apenas em `globals.css` e `fonts.ts` — **3 arquivos no total**

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/app/globals.css` | Todos os tokens CSS (light + dark). Inclui `@theme inline` com font vars |
| `src/lib/fonts.ts` | Usa `geist` npm package. Exporta `geistSans`, `geistMono` + legacy aliases |
| `src/app/layout.tsx` | Aplica font classes no `<body>`, tem `themeColor: '#0F172A'` (precisa atualizar) |

### Technical Decisions

- **Fonte:** Trocar `geist` (npm) por `Inter` via `next/font/google` — sem novo pacote npm, built-in no Next.js
  - Manter `GeistMono` para código — continuidade e simplicidade
  - O legacy alias `inter` em `fonts.ts` apontará agora para o Inter real (corrigindo a inconsistência)
- **CSS var da fonte:** Inter será configurado com `variable: '--font-inter'`, e `globals.css` mudará `var(--font-geist-sans)` → `var(--font-inter)`
- **Cores — Paleta Supabase:**
  - `--primary`: `#3ECF8E` (verde Supabase) em ambos os modos
  - `--primary-foreground`: `#1C1C1C` (texto escuro sobre verde)
  - Dark `--background`: `#1C1C1C` | `--surface/--card`: `#252525`
  - Dark `--border`: `#2E2E2E` | `--muted`: `#2A2A2A` | `--foreground`: `#EDEDED`
  - Light `--background`: `#FFFFFF` | `--surface`: `#F6F8FA`
- **Radius:** `0.375rem` (6px) — Supabase usa bordas menores que o atual `0.625rem`
- **`themeColor` no viewport:** Dark `#1C1C1C` (era `#0F172A`), Light `#FFFFFF` (inalterado)
- **Suporte dark/light:** Mantido

## Implementation Plan

### Tasks

- [x] Task 1: Atualizar `src/lib/fonts.ts` — trocar GeistSans por Inter
  - **File:** `src/lib/fonts.ts`
  - **Action:** Substituir o conteúdo completo do arquivo pelo seguinte:
    ```ts
    import { Inter } from 'next/font/google';
    import { GeistMono } from 'geist/font/mono';

    export const inter = Inter({
      subsets: ['latin'],
      variable: '--font-inter',
    });

    export const geistMono = GeistMono;

    // Legacy aliases para não quebrar imports existentes
    export const geistSans = inter; // aponta para Inter
    export const poppins = { variable: inter.variable };
    ```
  - **Notes:** `next/font/google` é built-in no Next.js — sem `npm install`. O `geistMono` continua vindo do pacote `geist` (já instalado). O alias `geistSans` é mantido porque `layout.tsx` o importa — evita ter que mudar o layout além do necessário. O alias `inter` agora aponta para o Inter real.

- [x] Task 2: Atualizar `src/app/layout.tsx` — atualizar `themeColor` dark
  - **File:** `src/app/layout.tsx`
  - **Action:** No objeto `viewport`, atualizar apenas o `themeColor` do dark mode:
    ```ts
    // Linha a alterar (atualmente):
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
    // Substituir por:
    { media: '(prefers-color-scheme: dark)', color: '#1C1C1C' },
    ```
  - **Notes:** O import de fonts (`geistSans, geistMono`) e o className no `<body>` **não mudam** — o alias `geistSans` após a Task 1 já injeta `--font-inter` automaticamente.

- [x] Task 3: Substituir todos os tokens CSS em `src/app/globals.css`
  - **File:** `src/app/globals.css`
  - **Action:** Substituir o conteúdo completo do arquivo pelo seguinte conteúdo:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-heading: var(--font-inter);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);

  /* Design System — Custom color tokens */
  --color-surface: var(--surface);
  --color-text-primary: var(--foreground);
  --color-text-secondary: var(--muted-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--destructive);
  --color-info: var(--info);
}

:root {
  /* Design System — Light Mode (Supabase) */
  --background: #FFFFFF;
  --foreground: #1C1C1C;
  --surface: #F6F8FA;
  --primary: #3ECF8E;
  --primary-foreground: #1C1C1C;
  --primary-hover: #38BF82;
  --border: #E2E8F0;

  /* ShadCN mappings */
  --card: #F6F8FA;
  --card-foreground: #1C1C1C;
  --popover: #FFFFFF;
  --popover-foreground: #1C1C1C;
  --secondary: #F6F8FA;
  --secondary-foreground: #1C1C1C;
  --muted: #F1F5F9;
  --muted-foreground: #71717A;
  --accent: #F1F5F9;
  --accent-foreground: #1C1C1C;
  --destructive: #E57575;
  --input: #E2E8F0;
  --ring: #3ECF8E;

  /* Semantic colors */
  --success: #3ECF8E;
  --warning: #F59E0B;
  --info: #3B82F6;

  /* Chart colors */
  --chart-1: #3ECF8E;
  --chart-2: #38BF82;
  --chart-3: #F59E0B;
  --chart-4: #3B82F6;
  --chart-5: #E57575;

  --radius: 0.375rem;

  /* Sidebar — Light */
  --sidebar: #F6F8FA;
  --sidebar-foreground: #1C1C1C;
  --sidebar-primary: #3ECF8E;
  --sidebar-primary-foreground: #1C1C1C;
  --sidebar-accent: #F1F5F9;
  --sidebar-accent-foreground: #1C1C1C;
  --sidebar-border: #E2E8F0;
  --sidebar-ring: #3ECF8E;
}

.dark {
  /* Design System — Dark Mode (Supabase) */
  --background: #1C1C1C;
  --foreground: #EDEDED;
  --surface: #252525;
  --primary: #3ECF8E;
  --primary-foreground: #1C1C1C;
  --primary-hover: #4ADFA0;
  --border: #2E2E2E;

  /* ShadCN mappings */
  --card: #252525;
  --card-foreground: #EDEDED;
  --popover: #252525;
  --popover-foreground: #EDEDED;
  --secondary: #2A2A2A;
  --secondary-foreground: #EDEDED;
  --muted: #2A2A2A;
  --muted-foreground: #A1A1AA;
  --accent: #2A2A2A;
  --accent-foreground: #EDEDED;
  --destructive: #E57575;
  --input: #2E2E2E;
  --ring: #3ECF8E;

  /* Semantic colors */
  --success: #3ECF8E;
  --warning: #F59E0B;
  --info: #3B82F6;

  /* Chart colors */
  --chart-1: #3ECF8E;
  --chart-2: #4ADFA0;
  --chart-3: #F59E0B;
  --chart-4: #3B82F6;
  --chart-5: #E57575;

  /* Sidebar — Dark */
  --sidebar: #252525;
  --sidebar-foreground: #EDEDED;
  --sidebar-primary: #3ECF8E;
  --sidebar-primary-foreground: #1C1C1C;
  --sidebar-accent: #2A2A2A;
  --sidebar-accent-foreground: #EDEDED;
  --sidebar-border: #2E2E2E;
  --sidebar-ring: #3ECF8E;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans scroll-smooth;
  }

  /* Typography — Type Scale */
  h1 {
    font-family: var(--font-heading);
    font-size: 2.25rem;
    line-height: 1.2;
    font-weight: 700;
  }
  h2 {
    font-family: var(--font-heading);
    font-size: 1.875rem;
    line-height: 1.25;
    font-weight: 600;
  }
  h3 {
    font-family: var(--font-heading);
    font-size: 1.5rem;
    line-height: 1.3;
    font-weight: 600;
  }
  h4 {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    line-height: 1.4;
    font-weight: 600;
  }

  /* Accessibility — focus-visible */
  :focus-visible {
    outline: 2px solid #3ECF8E;
    outline-offset: 2px;
  }

  /* Accessibility — reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Skip link */
  .skip-link {
    position: absolute;
    top: -100%;
    left: 0;
    z-index: 100;
    padding: 1rem;
    background: var(--primary);
    color: var(--primary-foreground);
  }
  .skip-link:focus {
    top: 0;
  }
}
```

  - **Notes:**
    - `--font-sans` e `--font-heading` agora apontam para `var(--font-inter)` (injetado via Task 1)
    - `--font-mono` aponta para `var(--font-geist-mono)` (GeistMono continua ativo)
    - `--radius` reduzido de `0.625rem` para `0.375rem`
    - `:focus-visible` outline atualizado de `#2563EB` → `#3ECF8E`
    - Estrutura do `@theme inline` e `@layer base` mantida identicamente — só os valores mudam

### Acceptance Criteria

- [x] AC 1: Dado que o app está em **dark mode**, quando qualquer botão primário é renderizado, então ele deve ter background `#3ECF8E` e texto `#1C1C1C`
- [x] AC 2: Dado que o app está em **dark mode**, quando a página principal é carregada, então o background do `<body>` deve ser `#1C1C1C` e o texto `#EDEDED`
- [x] AC 3: Dado que o app está em **light mode**, quando a página principal é carregada, então o background do `<body>` deve ser `#FFFFFF` e o texto `#1C1C1C`
- [x] AC 4: Dado que qualquer texto do app é renderizado, quando inspecionado no browser via DevTools, então a `font-family` aplicada deve ser **Inter** (não Geist Sans)
- [x] AC 5: Dado que qualquer input ou card é renderizado, quando inspecionado no browser, então o `border-radius` computado deve ser `~6px` (0.375rem)
- [x] AC 6: Dado que qualquer elemento interativo recebe foco via teclado, quando o foco é visível, então o outline de foco deve ser verde `#3ECF8E`
- [x] AC 7: Dado que o `themeColor` da PWA é lido pelo browser em dark mode, então deve retornar `#1C1C1C` (não `#0F172A`)
- [x] AC 8: Dado que o app é compilado, quando `npm run build` e `npm run type-check` são executados, então **não deve haver erros**

## Additional Context

### Dependencies

- `next/font/google` — built-in no Next.js, **sem `npm install`** adicional
- `geist` (npm package) — já instalado, continua sendo usado para GeistMono
- Nenhuma dependência nova de serviço ou banco de dados

### Testing Strategy

**Manual (visual):**
1. Rodar `npm run dev` e inspecionar a UI em dark mode e light mode
2. Verificar no DevTools → Elements → Computed: `font-family` aplicada nos textos (deve ser Inter)
3. Verificar no DevTools → Elements → Computed: CSS vars `--primary`, `--background`, `--border`
4. Verificar `border-radius` em inputs e cards (~6px)
5. Navegar por Tab e confirmar outline verde nos elementos focados

**Build check:**
```bash
npm run build
npm run type-check
npm run lint
```

### Notes

**Riscos:**
- `geistSans` alias em `fonts.ts` aponta para o objeto Inter — a propriedade `.variable` do Inter retorna `'--font-inter'`, diferente do original `'--font-geist-sans'`. Isso é **intencional** e funciona porque o `@theme inline` em `globals.css` foi atualizado para usar `var(--font-inter)`.
- A busca na investigação confirmou que **apenas `layout.tsx`** usa `geistSans.variable` — nenhum outro arquivo precisa ser atualizado.

**Considerações futuras (fora do escopo):**
- Auditar componentes individuais (Button, Badge, etc.) para ajustes visuais além dos tokens
- Adicionar gradients e glassmorphism tokens específicos do Supabase
