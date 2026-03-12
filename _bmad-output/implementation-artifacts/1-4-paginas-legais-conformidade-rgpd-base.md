# Story 1.4: Páginas Legais & Conformidade RGPD Base

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **visitor**,
I want **to access the privacy policy and terms of use**,
so that **I can understand how my data is handled before creating an account (RGPD compliance)**.

## Acceptance Criteria

1. **Given** um visitante acessa `/privacy` ou `/terms` **When** a página carrega **Then** o conteúdo legal é exibido em formato legível com tipografia clara
2. **And** a política de privacidade inclui: dados coletados, base legal (RGPD Art. 6), direitos do usuário (acesso, retificação, exclusão, portabilidade), contact DPO
3. **And** os termos de uso incluem: descrição do serviço, responsabilidades, disclaimers sobre IA (não substitui profissionais certificados), condições de cancelamento
4. **And** o banner de cookie consent (`CookieConsent` component) é exibido na primeira visita em todas as páginas públicas
5. **And** o consentimento é armazenado em `localStorage` e respeita a preferência do usuário
6. **And** links para privacy e terms estão presentes no footer de todas as páginas
7. **And** as páginas são renderizadas via SSR para SEO (meta tags, canonical URLs)
8. **And** as páginas são responsivas e suportam dark/light mode
9. **And** acessibilidade: semantic HTML (`<article>`, `<section>`, `<h1>`-`<h3>`), focus-visible, WCAG 2.1 AA

## Tasks / Subtasks

- [x] Task 1: Criar página de Política de Privacidade (AC: #1, #2, #7, #8, #9)
  - [x] 1.1 Criar `src/app/(public)/privacy/page.tsx` como Server Component
  - [x] 1.2 Implementar `generateMetadata()` com título "Politique de Confidentialité | Ultra IA", description, canonical URL
  - [x] 1.3 Conteúdo legal em francês cobrindo: dados coletados (conta, conversas, pagamento, cookies), base legal RGPD (Art. 6 — consentimento e execução de contrato), direitos do usuário (acesso Art. 15, retificação Art. 16, exclusão Art. 17, portabilidade Art. 20, oposição Art. 21), contact DPO, período de retenção de dados, transferências internacionais
  - [x] 1.4 Layout: `<article>` wrapper, max-width `prose` (65ch), tipografia clara com `<h1>`, `<h2>`, `<h3>`, listas `<ul>`/`<ol>` para direitos
  - [x] 1.5 Responsividade: padding `px-4` mobile, `px-6` tablet, centrado no desktop
  - [x] 1.6 Dark mode: usar classes Tailwind `text-foreground`, `text-muted-foreground` para contraste

- [x] Task 2: Criar página de Termos de Uso (AC: #1, #3, #7, #8, #9)
  - [x] 2.1 Criar `src/app/(public)/terms/page.tsx` como Server Component
  - [x] 2.2 Implementar `generateMetadata()` com título "Conditions Générales d'Utilisation | Ultra IA", description, canonical URL
  - [x] 2.3 Conteúdo legal em francês cobrindo: descrição do serviço (plateforme SaaS de spécialistes IA), condições de acesso (inscription, abonnement), responsabilidades do usuário, disclaimer IA (l'IA ne remplace pas les professionnels certifiés — juridique, fiscal, médical), propriedade intelectual, condições de cancelamento (via Stripe portal), limitação de responsabilidade, lei aplicável (droit français), foro competente
  - [x] 2.4 Layout: mesmo padrão da página de privacidade — `<article>`, `prose`, tipografia clara
  - [x] 2.5 Cross-link: link para `/privacy` dentro dos termos e vice-versa

- [x] Task 3: Criar componente CookieConsent (AC: #4, #5, #8, #9)
  - [x] 3.1 Criar `src/components/shared/cookie-consent.tsx` como Client Component (`'use client'`)
  - [x] 3.2 Banner fixo na base da tela (sticky bottom) com: texto explicativo curto, botões "Accepter" e "Refuser", link para `/privacy`
  - [x] 3.3 Lógica de estado: verificar `localStorage.getItem('cookie-consent')` ao montar; se existe, não mostrar banner
  - [x] 3.4 Ao clicar "Accepter": `localStorage.setItem('cookie-consent', 'accepted')` + fechar banner
  - [x] 3.5 Ao clicar "Refuser": `localStorage.setItem('cookie-consent', 'refused')` + fechar banner
  - [x] 3.6 Usar animação de entrada (slide-up) com `transition` e `translate-y`
  - [x] 3.7 Responsividade: botões em row no desktop, stack no mobile (< 640px)
  - [x] 3.8 Dark mode: usar variáveis CSS do design system (`bg-card`, `border`, `text-foreground`)
  - [x] 3.9 Acessibilidade: `role="dialog"`, `aria-label="Gestion des cookies"`, focus trap nos botões, `aria-describedby` para o texto explicativo

- [x] Task 4: Criar componente Footer (AC: #6)
  - [x] 4.1 Criar `src/components/layout/footer.tsx` como Server Component
  - [x] 4.2 Layout: container max-width centrado, 3 seções — logo/description, links legais, copyright
  - [x] 4.3 Links legais obrigatórios: "Politique de Confidentialité" (`/privacy`), "Conditions d'Utilisation" (`/terms`)
  - [x] 4.4 Copyright: `© {ano} Ultra IA. Tous droits réservés.`
  - [x] 4.5 Responsividade: flex-row no desktop, flex-col no mobile
  - [x] 4.6 Dark mode: border-top com `border-border`, text `text-muted-foreground`
  - [x] 4.7 Semantic HTML: `<footer>`, `<nav aria-label="Liens légaux">`, links com `<a>`

- [x] Task 5: Integrar CookieConsent no Root Layout (AC: #4)
  - [x] 5.1 Importar `CookieConsent` em `src/app/layout.tsx`
  - [x] 5.2 Adicionar `<CookieConsent />` dentro do `<ThemeProvider>`, após `<Toaster />`
  - [x] 5.3 Verificar que o banner aparece em TODAS as páginas (não apenas públicas)

- [x] Task 6: Integrar Footer no Public Layout (AC: #6)
  - [x] 6.1 Importar `Footer` em `src/app/(public)/layout.tsx`
  - [x] 6.2 Substituir o placeholder footer pelo componente `<Footer />` (já implementado na Story 1.2)

- [x] Task 7: Validação final (AC: todos)
  - [x] 7.1 `npm run lint` sem erros
  - [x] 7.2 `npx tsc --noEmit` sem erros
  - [x] 7.3 Verificar `/privacy` renderiza com conteúdo legal completo
  - [x] 7.4 Verificar `/terms` renderiza com conteúdo legal completo
  - [x] 7.5 Verificar cookie banner aparece na primeira visita, desaparece após aceitar/recusar
  - [x] 7.6 Verificar footer com links legais funcionais em todas as páginas públicas
  - [x] 7.7 Testar dark mode em todas as páginas/componentes
  - [x] 7.8 Verificar acessibilidade: keyboard navigation, focus-visible, aria attributes
  - [x] 7.9 Verificar SSR: view-source mostra conteúdo legal renderizado

## Dev Notes

### Pré-requisitos da Story 1.1

Esta story depende apenas da Story 1.1 (que está done):

**Da Story 1.1:**
- Projeto Next.js 16.1.6 com TypeScript, Tailwind CSS 4, ShadCN, Prisma
- Design system (CSS custom properties, cores, tipografia Poppins/Inter, next-themes)
- Estrutura de pastas com route groups: `(public)`, `(auth)`, `(dashboard)`, `(admin)`
- Componentes ShadCN base: Button, Card, Dialog, Switch, etc.
- Root layout com ThemeProvider, TooltipProvider, Toaster, skip-link
- Public layout com placeholders para header e footer
- `src/lib/utils.ts` com `cn()` helper
- `src/lib/constants.ts` com `APP_NAME`, `APP_DESCRIPTION`, `APP_URL`

**NOTA:** Stories 1.2 e 1.3 estão `ready-for-dev` mas NÃO implementadas. O Footer será criado nesta story e reutilizado por 1.2 quando implementada. O Header não é escopo desta story.

### Padrões de Arquitetura Obrigatórios

- **Rendering:** SSR via Server Component para páginas legais (SEO). Client Component apenas para CookieConsent (interatividade)
- **Routing:** Páginas dentro de `src/app/(public)/` — herdam o public layout
- **Import Order:** React/Next → Libs externas → Components (@/) → Lib/utils → Types → Stores
- **Naming:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars)
- **HTML Semântico:** `<article>` para conteúdo legal, `<section>` para seções, `<nav>` para links, `<footer>` para footer
- **Estilização:** Tailwind CSS classes, design tokens do globals.css, `cn()` para merge de classes
- **Acessibilidade:** WCAG 2.1 AA — contraste 4.5:1, touch targets 44x44px, focus-visible, aria-labels
- **Idioma:** Todo o conteúdo em francês (interface em francês, `lang="fr"` no root layout)

### Layout — Páginas Legais

```
┌─────────────────────────────────────────────────┐
│  Header (placeholder — implementar na Story 1.2)│
├─────────────────────────────────────────────────┤
│                                                  │
│  Politique de Confidentialité                    │  ← H1, Poppins 700
│  Dernière mise à jour : 11 mars 2026            │  ← Caption, text-muted
│                                                  │
│  1. Données Collectées                           │  ← H2
│  ────────────────────                            │
│  Nous collectons les données suivantes :         │
│  • Données de compte (nom, email)                │
│  • Données de conversation (anonymisées)         │
│  • Données de paiement (via Stripe)              │
│  • Cookies fonctionnels                          │
│                                                  │
│  2. Base Légale                                  │  ← H2
│  ────────────────                                │
│  Le traitement de vos données est fondé sur :    │
│  • Votre consentement (Art. 6.1.a RGPD)         │
│  • L'exécution du contrat (Art. 6.1.b RGPD)     │
│                                                  │
│  3. Vos Droits                                   │  ← H2
│  ────────────                                    │
│  Conformément au RGPD, vous disposez de :        │
│  • Droit d'accès (Art. 15)                       │
│  • Droit de rectification (Art. 16)              │
│  • Droit à l'effacement (Art. 17)                │
│  • Droit à la portabilité (Art. 20)              │
│  • Droit d'opposition (Art. 21)                  │
│  ...                                             │
│                                                  │
├─────────────────────────────────────────────────┤
│  Footer                                          │
│  Ultra IA │ Politique de Confidentialité │ CGU   │
│  © 2026 Ultra IA. Tous droits réservés.          │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🍪 Nous utilisons des cookies...            │ │  ← CookieConsent banner
│ │          [Refuser]  [Accepter]              │ │     (sticky bottom)
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Layout — Footer

```
Desktop (> 768px):
┌─────────────────────────────────────────────────────┐
│ Ultra IA                      Liens                  │
│ Plateforme de consultation    • Politique de Conf.   │
│ avec des spécialistes IA.     • Conditions d'Util.   │
│                                                      │
│ ─────────────────────────────────────────────────── │
│ © 2026 Ultra IA. Tous droits réservés.               │
└─────────────────────────────────────────────────────┘

Mobile (< 768px):
┌───────────────────────────┐
│ Ultra IA                   │
│ Plateforme de consultation │
│ avec des spécialistes IA.  │
│                            │
│ Liens                      │
│ • Politique de Conf.       │
│ • Conditions d'Util.       │
│                            │
│ ────────────────────────── │
│ © 2026 Ultra IA.           │
│ Tous droits réservés.      │
└───────────────────────────┘
```

### Layout — CookieConsent Banner

```
Desktop:
┌──────────────────────────────────────────────────────────────┐
│ 🍪  Nous utilisons des cookies fonctionnels pour              │
│     améliorer votre expérience. En savoir plus.   [Refuser] [Accepter] │
└──────────────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────┐
│ 🍪  Nous utilisons des cookies  │
│     fonctionnels pour améliorer │
│     votre expérience.           │
│     En savoir plus.             │
│                                 │
│   [Refuser]    [Accepter]       │
└─────────────────────────────────┘
```

### Conteúdo Legal — Estrutura Requerida

**Politique de Confidentialité (`/privacy`):**
1. Données Collectées — compte (nom, email), conversations (anonymisées), paiement (Stripe), cookies
2. Base Légale — consentement (Art. 6.1.a), exécution du contrat (Art. 6.1.b)
3. Finalité du Traitement — fourniture du service, amélioration, communication
4. Vos Droits — accès (Art. 15), rectification (Art. 16), effacement (Art. 17), portabilité (Art. 20), opposition (Art. 21)
5. Cookies — fonctionnels uniquement (MVP), localStorage pour préférences
6. Durée de Conservation — données de compte: durée de l'abonnement + 1 an, conversations: anonymisées après suppression de compte
7. Transferts Internationaux — Stripe (US, Privacy Shield), Vercel (EU), Neon (EU Frankfurt)
8. Contact DPO — email de contact
9. Modifications — notification des changements par email

**Conditions Générales d'Utilisation (`/terms`):**
1. Description du Service — plateforme SaaS, spécialistes IA, abonnement mensuel
2. Inscription et Compte — conditions de création de compte, responsabilité des identifiants
3. Abonnement et Paiement — tarification, renouvellement automatique, Stripe
4. Utilisation du Service — usage personnel et professionnel, limites (100 req/jour)
5. Avertissement IA — **l'IA ne remplace pas les professionnels certifiés** (juridique, fiscal, médical), limitation de responsabilité
6. Propriété Intellectuelle — contenu plateforme, contenu utilisateur
7. Résiliation — par l'utilisateur (via Stripe portal), par la plateforme
8. Limitation de Responsabilité — clause de non-responsabilité
9. Droit Applicable — droit français
10. Contact — coordonnées

### CookieConsent — Implementação Técnica

```typescript
// src/components/shared/cookie-consent.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setIsVisible(true);
  }, []);

  const handleConsent = (value: 'accepted' | 'refused') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      aria-describedby="cookie-consent-description"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t bg-card p-4 shadow-lg',
        'animate-in slide-in-from-bottom duration-300'
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id="cookie-consent-description" className="text-sm text-muted-foreground">
          Nous utilisons des cookies fonctionnels pour améliorer votre expérience.{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleConsent('refused')}>
            Refuser
          </Button>
          <Button size="sm" onClick={() => handleConsent('accepted')}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Footer — Implementação Técnica

```typescript
// src/components/layout/footer.tsx
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-heading text-lg font-semibold">{APP_NAME}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Plateforme de consultation avec des spécialistes IA.
            </p>
          </div>
          <nav aria-label="Liens légaux">
            <p className="mb-2 text-sm font-semibold">Liens</p>
            <ul className="space-y-1">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Conditions d'Utilisation
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {APP_NAME}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

### Padrão de Página Legal

```typescript
// Padrão para src/app/(public)/privacy/page.tsx e terms/page.tsx
import type { Metadata } from 'next';
import { APP_NAME, APP_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: `Politique de confidentialité de ${APP_NAME}. Découvrez comment nous protégeons vos données.`,
  alternates: { canonical: `${APP_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-prose px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold sm:text-4xl">
        Politique de Confidentialité
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : 11 mars 2026
      </p>
      {/* Seções legais com <section>, <h2>, <ul> */}
    </article>
  );
}
```

### Project Structure Notes

- Todas as páginas dentro de `src/app/(public)/` herdam o public layout
- O Footer é criado em `src/components/layout/footer.tsx` — reutilizável por outras stories
- O CookieConsent fica no root layout (global, não apenas público) para cobrir todas as páginas
- Sem necessidade de modelo Prisma para cookie consent — `localStorage` é suficiente para MVP (apenas cookies funcionais)
- Sem API route necessária — páginas são estáticas com SSR

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar coleta real de cookies analytics/marketing — MVP usa apenas cookies funcionais (next-themes, session)
- **NÃO** criar API route para consentimento — localStorage é suficiente para MVP
- **NÃO** implementar modelo Prisma para CookieConsent — sem necessidade no MVP
- **NÃO** implementar header — é escopo da Story 1.2
- **NÃO** usar conteúdo legal genérico em inglês — todo conteúdo em francês
- **NÃO** usar `useEffect` ou `useState` nas páginas legais — são 100% Server Component
- **NÃO** copiar textos legais de outros sites — criar conteúdo original baseado nos requisitos RGPD
- **NÃO** esquecer os artigos RGPD referenciados — cada direito deve citar o artigo correspondente
- **NÃO** esquecer o disclaimer IA nos termos — é obrigatório por FR26
- **NÃO** usar `<img>` — usar `next/image` se necessário
- **NÃO** esquecer cross-links entre privacy e terms
- **NÃO** esquecer `aria-label` no footer nav e no cookie consent dialog

### Ficheiros a Criar/Modificar

```
NOVOS:
src/app/(public)/privacy/page.tsx              # Politique de Confidentialité
src/app/(public)/terms/page.tsx                # Conditions Générales d'Utilisation
src/components/shared/cookie-consent.tsx        # CookieConsent banner component
src/components/layout/footer.tsx                # Footer component

MODIFICADOS:
src/app/layout.tsx                              # Adicionar <CookieConsent />
src/app/(public)/layout.tsx                     # Substituir placeholder footer por <Footer />
```

### Componentes Reutilizados

| Componente | Localização | Uso nesta Story |
|---|---|---|
| `Button` (ShadCN) | `components/ui/button.tsx` | Botões Accepter/Refuser no CookieConsent |
| `ThemeProvider` | `components/shared/theme-provider.tsx` | Dark/light mode (já integrado) |
| `cn()` | `lib/utils.ts` | Merge de classes Tailwind |
| `APP_NAME`, `APP_URL` | `lib/constants.ts` | Nome e URL no footer e metadata |
| `Toaster` (Sonner) | `components/ui/sonner.tsx` | Já presente no root layout |

### Conformidade RGPD — Checklist

| Requisito RGPD | Implementação |
|---|---|
| Informação transparente (Art. 12-14) | Politique de Confidentialité em linguagem clara |
| Base legal (Art. 6) | Consentement + Exécution du contrat documentados |
| Direitos do titular (Art. 15-21) | Seção "Vos Droits" com cada artigo citado |
| Cookies (ePrivacy Directive) | CookieConsent banner com aceitar/recusar |
| Contact DPO | Email de contacto na politique de confidentialité |
| Menores (Art. 8) | Service réservé aux professionnels (18+) nos termos |

### Dependências entre Stories

| Story | Relação | Impacto |
|---|---|---|
| 1.1 (done) | Pré-requisito | Design system, estrutura, ShadCN, Prisma |
| 1.2 (ready-for-dev) | Paralela | Footer criado aqui será reutilizado. Header placeholder mantido |
| 1.3 (ready-for-dev) | Paralela | Sem dependência direta |
| 2.5 (backlog) | Futura | Exportação/exclusão de dados referenciada na privacy policy |

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.4 Acceptance Criteria, Epic 1 Overview]
- [Source: _bmad-output/planning-artifacts/architecture.md — Public Route Group, Project Structure, Cookie Consent Component, Footer, RGPD Compliance, Environment Variables]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Footer Layout, CookieConsent Component, WCAG 2.1 AA, Dark/Light Mode, Responsive Strategy]
- [Source: _bmad-output/planning-artifacts/prd.md — FR28 (Armazenamento Anônimo RGPD), NFR11 (Conformidade RGPD), NFR6-NFR13 (Security)]
- [Source: _bmad-output/implementation-artifacts/1-3-pagina-publica-do-especialista.md — Padrões SSR, Server Components, generateMetadata Pattern, Design Conventions]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Story cobre criação de 4 ficheiros novos e modificação de 2 existentes
- CookieConsent usa apenas localStorage (sem DB) — suficiente para MVP com cookies funcionais
- Todo conteúdo legal em francês, citando artigos RGPD específicos
- Footer e Header já estavam implementados pela Story 1.2 (em review) — reutilizados aqui
- Public layout já importava Footer e Header antes desta story
- CookieConsent usa lazy state initializer (`useState(() => {...})`) para evitar regra `react-hooks/set-state-in-effect` do eslint-config-next
- Padrão de página legal: Server Component + article/prose + generateMetadata + alternates.canonical
- Cross-links entre privacy e terms para navegação
- Guardrails respeitados: sem analytics cookies, sem API route, sem Prisma model para consent
- Disclaimer IA obrigatório nos termos (seção 5): "l'IA ne remplace pas les professionnels certifiés"
- 9 seções na política de privacidade, 10 seções nos termos de uso — conforme requisitos RGPD
- `npm run lint` ✅ sem erros | `npx tsc --noEmit` ✅ sem erros

### File List

**Criados:**
- `src/app/(public)/privacy/page.tsx`
- `src/app/(public)/terms/page.tsx`
- `src/components/shared/cookie-consent.tsx`

**Modificados:**
- `src/app/layout.tsx` (adicionado `<CookieConsent />` após `<Toaster />`)

**Já existentes (modificados nesta story — correções do code review):**
- `src/components/layout/footer.tsx` (corrigido: `<nav aria-label>`, `APP_NAME`, ano dinâmico)

**Já existentes (sem modificação nesta story):**
- `src/app/(public)/layout.tsx`

## Change Log

| Date | Changes |
|---|---|
| 2026-03-11 | Implementação completa: páginas /privacy e /terms em francês com conteúdo RGPD completo; componente CookieConsent com lazy state initializer; integração no root layout; Footer e layout público já existentes da Story 1.2 reutilizados. Lint e TSC sem erros. |
| 2026-03-11 | Code review (Claude Sonnet 4.6): corrigidos 6 issues — (1) CookieConsent: adicionado focus trap real (useRef + keydown handler Tab/Shift+Tab) + `aria-modal="true"`; (2) Footer: adicionado `<nav aria-label="Liens légaux">` e `<nav aria-label="Liens utiles">`, importado `APP_NAME`, copyright com `new Date().getFullYear()` dinâmico. Issues LOW (#pricing link, max-w, h3 headings) mantidos como dívida técnica. |
