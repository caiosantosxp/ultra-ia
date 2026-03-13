# Story 3.3: Subscription Gating & Controle de Acesso

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to control access based on subscription status**,
so that **only active subscribers can access the AI chat**.

## Acceptance Criteria

1. **Given** um usuário com assinatura `active` acessa `/chat` **When** a página carrega **Then** o chat é exibido normalmente
2. **Given** um usuário com assinatura `past_due` acessa `/chat` **When** a página carrega **Then** o chat é acessível (período de graça ativo) com PaymentBanner no topo alertando sobre a falha de pagamento (FR14)
3. **Given** um usuário com assinatura `canceled` ou sem assinatura acessa `/chat` **When** a página carrega **Then** o acesso ao chat é bloqueado (FR15) **And** é exibida uma página de bloqueio com mensagem e CTA para assinar/reativar
4. **Given** um usuário com assinatura `expired` acessa `/chat` **When** a página carrega **Then** o acesso ao chat é bloqueado com CTA para reativar
5. **Given** o período de graça expira sem pagamento **When** o sistema verifica o status via webhook (Story 3.2) **Then** o acesso ao chat é bloqueado automaticamente (FR15)
6. **And** subscription gating implementado via middleware no route group `(dashboard)` para rotas `/chat/*`
7. **And** API routes `/api/chat/*` e `/api/conversations/*` verificam subscription status server-side antes de processar
8. **And** Zustand `subscription-store` mantém cache client-side do status da assinatura para UI reativa
9. **And** PaymentBanner componente exibe alerta com `role="alert"` e `aria-live="assertive"` (acessibilidade)
10. **And** página de bloqueio é responsiva e suporta dark/light mode
11. **And** hook `useSubscription` fornece status e helpers para componentes client-side

## Tasks / Subtasks

- [x] Task 1: Criar helper de verificação de subscription server-side (AC: #1, #2, #3, #4, #6, #7)
  - [x] 1.1 Criar `src/lib/subscription.ts` com funções de verificação:
    ```typescript
    import { prisma } from '@/lib/prisma';
    import { SubscriptionStatus } from '@prisma/client';

    export type SubscriptionAccess = {
      hasAccess: boolean;
      status: SubscriptionStatus | 'none';
      isPastDue: boolean;
      subscription: Subscription | null;
    };

    export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionAccess> {
      const subscription = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) {
        return { hasAccess: false, status: 'none', isPastDue: false, subscription: null };
      }

      const hasAccess = subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE';
      const isPastDue = subscription.status === 'PAST_DUE';

      return { hasAccess, status: subscription.status, isPastDue, subscription };
    }
    ```
  - [x] 1.2 Exportar types: `SubscriptionAccess` para reutilização

- [x] Task 2: Atualizar middleware para subscription gating (AC: #6)
  - [x] 2.1 Atualizar `middleware.ts` para verificar subscription nas rotas `/chat/*`:
    - Após auth check, verificar se user tem subscription ativa
    - Se não tem subscription → redirect para `/pricing` ou página de bloqueio
    - NOTA: middleware Next.js é Edge Runtime — não pode usar Prisma diretamente
    - Abordagem: usar API interna ou session callback com subscription data
  - [x] 2.2 Abordagem alternativa (recomendada): Fazer gating no layout do dashboard ao invés do middleware Edge, já que Prisma não roda no Edge:
    ```typescript
    // src/app/(dashboard)/chat/layout.tsx
    import { auth } from '@/lib/auth';
    import { checkSubscriptionAccess } from '@/lib/subscription';
    import { redirect } from 'next/navigation';
    import { PaymentBanner } from '@/components/shared/payment-banner';
    import { SubscriptionBlockedPage } from '@/components/shared/subscription-blocked';

    export default async function ChatLayout({ children }: { children: React.ReactNode }) {
      const session = await auth();
      if (!session?.user) redirect('/login');

      const access = await checkSubscriptionAccess(session.user.id);

      if (!access.hasAccess) {
        return <SubscriptionBlockedPage status={access.status} />;
      }

      return (
        <>
          {access.isPastDue && <PaymentBanner />}
          {children}
        </>
      );
    }
    ```
  - [x] 2.3 Criar `src/app/(dashboard)/chat/layout.tsx` com o gating server-side

- [x] Task 3: Criar componente PaymentBanner (AC: #2, #9)
  - [x] 3.1 Criar `src/components/shared/payment-banner.tsx` como Server Component ou Client Component:
    ```typescript
    import { AlertTriangle } from 'lucide-react';
    import Link from 'next/link';
    import { buttonVariants } from '@/components/ui/button';

    export function PaymentBanner() {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-4 border-b border-warning/30 bg-warning/10 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
            <p className="text-sm font-medium">
              Votre paiement a échoué. Mettez à jour votre moyen de paiement pour continuer à utiliser le service.
            </p>
          </div>
          <Link
            href="/billing"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Mettre à jour
          </Link>
        </div>
      );
    }
    ```
  - [x] 3.2 Acessibilidade: `role="alert"`, `aria-live="assertive"`, `aria-hidden` no ícone
  - [x] 3.3 Cores: usar token `warning` (#F59E0B) do design system
  - [x] 3.4 Responsivo: texto trunca em mobile, CTA empilha abaixo

- [x] Task 4: Criar página de bloqueio de acesso (AC: #3, #4, #10)
  - [x] 4.1 Criar `src/components/shared/subscription-blocked.tsx`:
    - Card centralizado com mensagem clara em francês
    - Status `canceled`: "Votre abonnement a été annulé. Réabonnez-vous pour accéder au chat."
    - Status `expired`: "Votre abonnement a expiré. Renouvelez pour continuer."
    - Status `none`: "Vous n'avez pas encore d'abonnement. Choisissez un spécialiste pour commencer."
    - CTA principal: Link para `/pricing` — "Voir les offres" (Button primary)
    - CTA secondaire: Link para `/` — "Retour à l'accueil" (Button outline)
    - Ícone: `ShieldOff` ou `Lock` de lucide-react
  - [x] 4.2 Layout: centrado, max-w-md, Card com CardHeader + CardContent + CardFooter
  - [x] 4.3 Responsivo: full-width mobile, centrado desktop
  - [x] 4.4 Dark mode: usar variáveis CSS design system

- [x] Task 5: Criar Zustand subscription-store (AC: #8)
  - [x] 5.1 Criar `src/stores/subscription-store.ts`:
    ```typescript
    import { create } from 'zustand';
    import { SubscriptionStatus } from '@prisma/client';

    interface SubscriptionState {
      status: SubscriptionStatus | 'none' | null;
      isPastDue: boolean;
      isLoading: boolean;
      setSubscription: (status: SubscriptionStatus | 'none', isPastDue: boolean) => void;
      setLoading: (loading: boolean) => void;
      reset: () => void;
    }

    export const useSubscriptionStore = create<SubscriptionState>((set) => ({
      status: null,
      isPastDue: false,
      isLoading: true,
      setSubscription: (status, isPastDue) => set({ status, isPastDue, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ status: null, isPastDue: false, isLoading: true }),
    }));
    ```
  - [x] 5.2 Instalar Zustand se não instalado: `npm install zustand`

- [x] Task 6: Criar hook useSubscription (AC: #8, #11)
  - [x] 6.1 Criar `src/hooks/use-subscription.ts`:
    ```typescript
    'use client';
    import { useEffect } from 'react';
    import { useSubscriptionStore } from '@/stores/subscription-store';

    export function useSubscription() {
      const { status, isPastDue, isLoading, setSubscription, setLoading } = useSubscriptionStore();

      useEffect(() => {
        async function fetchStatus() {
          try {
            setLoading(true);
            const res = await fetch('/api/subscription');
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                setSubscription(data.data.status, data.data.isPastDue);
              }
            }
          } catch {
            // Silently fail — server-side gating is the source of truth
          }
        }
        fetchStatus();
      }, [setSubscription, setLoading]);

      const hasAccess = status === 'ACTIVE' || status === 'PAST_DUE';

      return { status, isPastDue, isLoading, hasAccess };
    }
    ```
  - [x] 6.2 Hook depende de `GET /api/subscription` (route da Story 3.1) retornando `{ success, data: { status, isPastDue } }`

- [x] Task 7: Proteger API routes server-side (AC: #7)
  - [x] 7.1 Criar helper reutilizável `src/lib/api-guards.ts`:
    ```typescript
    import { auth } from '@/lib/auth';
    import { checkSubscriptionAccess } from '@/lib/subscription';
    import { NextResponse } from 'next/server';

    export async function requireSubscription() {
      const session = await auth();
      if (!session?.user) {
        return { error: NextResponse.json(
          { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
          { status: 401 }
        )};
      }

      const access = await checkSubscriptionAccess(session.user.id);
      if (!access.hasAccess) {
        return { error: NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Active subscription required' } },
          { status: 403 }
        )};
      }

      return { session, access };
    }
    ```
  - [x] 7.2 Este guard será usado nas API routes `/api/chat/*` e `/api/conversations/*` (Stories 4.x)

- [x] Task 8: Validação final (AC: todos)
  - [x] 8.1 `npm run lint` sem erros
  - [x] 8.2 `npx tsc --noEmit` sem erros TypeScript (sem erros nos arquivos desta story; erro pré-existente em pricing/page.tsx — Story 3.5)
  - [x] 8.3 Testar user com subscription `active`: chat acessível normalmente
  - [x] 8.4 Testar user com subscription `past_due`: chat acessível + PaymentBanner visível
  - [x] 8.5 Testar user com subscription `canceled`: chat bloqueado, página de bloqueio com CTA
  - [x] 8.6 Testar user sem subscription: chat bloqueado, mensagem para assinar
  - [x] 8.7 Testar PaymentBanner: responsivo, dark mode, acessibilidade (role="alert")
  - [x] 8.8 Testar página de bloqueio: responsivo, dark mode, links funcionais
  - [x] 8.9 Testar hook useSubscription: status atualizado após fetch
  - [x] 8.10 Verificar que API guard retorna 401/403 corretamente

## Dev Notes

### Pré-requisitos — Stories Anteriores

Esta story depende CRITICAMENTE das Stories 3.1 e 3.2:

**Da Story 3.1 (Checkout & Criação de Assinatura Stripe):**
- Stripe configurado com `src/lib/stripe.ts` — Stripe client
- Modelo `Subscription` no Prisma já existe (definido na Story 1.1)
- `POST /api/subscription` — cria checkout session
- `GET /api/subscription` — retorna status da assinatura do user
- Pacote `stripe` instalado

**Da Story 3.2 (Webhooks Stripe):**
- `POST /api/webhooks/stripe` — processa eventos Stripe
- Subscription status atualizado automaticamente via webhooks: `ACTIVE`, `PAST_DUE`, `CANCELED`
- Idempotência via `event.id`
- Estado da subscription sempre sincronizado com Stripe

**Da Story 2.1 (Auth):**
- Auth.js v5 configurado com `auth()` helper
- Database Sessions com Prisma Adapter
- Middleware de auth protegendo rotas dashboard
- `src/types/next-auth.d.ts` com `id` e `role` na Session

**Da Story 1.1 (done):**
- Prisma schema com `Subscription` model + `SubscriptionStatus` enum (PENDING, ACTIVE, PAST_DUE, CANCELED, EXPIRED)
- Design system: cores semânticas (warning #F59E0B, error #EF4444)
- Componentes ShadCN: Button, Card, Badge, Separator
- `src/lib/prisma.ts` — PrismaClient singleton

### Estado Atual do Codebase

| Componente | Status | Ação Nesta Story |
|---|---|---|
| `prisma/schema.prisma` | Subscription model + enum existem | Sem alteração |
| `src/lib/subscription.ts` | Não existe | Criar helper de verificação |
| `src/lib/api-guards.ts` | Não existe | Criar guard reutilizável |
| `src/app/(dashboard)/chat/layout.tsx` | Não existe | Criar com gating |
| `src/components/shared/payment-banner.tsx` | Não existe | Criar componente |
| `src/components/shared/subscription-blocked.tsx` | Não existe | Criar página de bloqueio |
| `src/stores/subscription-store.ts` | Não existe (.gitkeep) | Criar Zustand store |
| `src/hooks/use-subscription.ts` | Não existe (.gitkeep) | Criar hook |
| `middleware.ts` | Auth gating apenas | Sem alteração (gating via layout) |

### Decisão Arquitetural Crítica: Layout Gating vs Middleware Gating

**Problema:** O middleware Next.js roda no Edge Runtime, que NÃO suporta Prisma Client (Node.js API). Portanto, não é possível fazer query ao banco diretamente no middleware.

**Solução escolhida:** Gating via Server Component no layout do chat (`src/app/(dashboard)/chat/layout.tsx`):
- ✅ Acesso total ao Prisma (Node.js runtime)
- ✅ Server-side, sem expose de lógica ao client
- ✅ Renderização condicional: PaymentBanner ou SubscriptionBlockedPage
- ✅ Reutiliza `auth()` do Auth.js
- ⚠️ Middleware continua fazendo auth check (redirect para /login se não autenticado)

**Alternativa considerada e rejeitada:** Adicionar subscription data ao session callback do Auth.js:
- ❌ Session fica stale (subscription pode mudar entre requests)
- ❌ Aumenta tamanho do cookie/session
- ❌ Não reflete mudanças em real-time de webhooks

### Subscription Status State Machine

```
PENDING ──────► ACTIVE ──────► PAST_DUE ──────► CANCELED
   │              │                │                │
   │              │                │                ▼
   │              │                └──────────► EXPIRED
   │              │
   │              └──────► CANCELED (user cancela)
   │
   └──────────────► (checkout abandonado, sem subscription)
```

**Regras de Acesso:**
| Status | Acesso ao Chat | UI |
|---|---|---|
| `ACTIVE` | ✅ Completo | Chat normal |
| `PAST_DUE` | ✅ Com aviso | Chat + PaymentBanner |
| `CANCELED` | ❌ Bloqueado | SubscriptionBlockedPage + CTA reativar |
| `EXPIRED` | ❌ Bloqueado | SubscriptionBlockedPage + CTA renovar |
| `PENDING` | ❌ Bloqueado | SubscriptionBlockedPage + CTA completar checkout |
| `none` | ❌ Bloqueado | SubscriptionBlockedPage + CTA assinar |

### PaymentBanner — Especificação UX

De acordo com o UX spec:
- **Purpose:** Banner de alerta quando pagamento falha
- **Anatomy:** Ícone warning + Texto + CTA "Mettre à jour le paiement"
- **States:** Ativo (pagamento pendente) | Removido (pagamento OK)
- **Accessibility:** `role="alert"`, `aria-live="assertive"`
- **Posição:** Topo da área de chat, abaixo do header, acima do conteúdo
- **Cor:** Warning (#F59E0B) com fundo `bg-warning/10`
- **Tom:** Respeitoso, não agressivo — "Votre paiement a échoué. Mettez à jour..."

### Journey 5 — Falha de Pagamento (do UX Spec)

```
Stripe: cartão recusado → Webhook → Email + Banner no chat
→ User vê aviso → Clica "Mettre à jour" → Portal Stripe
→ Pagamento OK? Sim → Banner removido, acesso mantido
                  Não → Período de graça X dias
→ Atualiza antes do prazo? Sim → OK
                            Não → Acesso ao chat bloqueado → Conta permanece ativa → Pode reativar
```

### Padrões de Arquitetura Obrigatórios

- **Server Action / API Pattern:** auth → validate → authorize (subscription check) → execute
- **API Response:** `{ success: true, data: {...} }` ou `{ success: false, error: { code, message } }`
- **Error Code para subscription:** `FORBIDDEN` (403) — "Active subscription required"
- **Zustand Store Pattern:** seguir padrão obrigatório da arquitectura (create, interface, export)
- **Import Order:** React/Next → Libs externas → Components (@/) → Lib/utils → Types → Stores
- **Naming:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars)
- **Idioma UI:** Francês (mensagens, labels, CTAs)
- **Acessibilidade:** WCAG 2.1 AA, `role="alert"` para banners, focus-visible

### Composants ShadCN Réutilisés

| Composant | Usage dans cette Story |
|---|---|
| `Button` + `buttonVariants` | CTA "Mettre à jour", "Voir les offres" |
| `Card` + `CardHeader` + `CardContent` + `CardFooter` | Container page de blocage |
| `Badge` | Indicateur status subscription (optionnel) |

### Ficheiros a Criar/Modificar

```
NOVOS:
src/lib/subscription.ts                              # Helper checkSubscriptionAccess
src/lib/api-guards.ts                                # Guard requireSubscription pour API routes
src/app/(dashboard)/chat/layout.tsx                   # Layout avec subscription gating
src/components/shared/payment-banner.tsx              # Banner alerte paiement échoué
src/components/shared/subscription-blocked.tsx        # Page blocage accès
src/stores/subscription-store.ts                      # Zustand store subscription status
src/hooks/use-subscription.ts                         # Hook client-side subscription

MODIFICADOS:
(nenhum ficheiro existente precisa de alteração)
```

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar checkout Stripe — é Story 3.1
- **NÃO** implementar webhooks Stripe — é Story 3.2
- **NÃO** implementar billing/portal Stripe — é Story 3.4
- **NÃO** implementar pricing page — é Story 3.5
- **NÃO** usar Prisma no middleware.ts — Edge Runtime não suporta
- **NÃO** armazenar subscription status no session cookie — fica stale
- **NÃO** fazer subscription check no client-side como fonte de verdade — sempre server-side
- **NÃO** bloquear rotas `/settings` ou `/billing` — user precisa aceder mesmo sem subscription
- **NÃO** esquecer `role="alert"` e `aria-live="assertive"` no PaymentBanner
- **NÃO** usar modais para bloqueio — usar página completa (melhor UX segundo spec)
- **NÃO** esquecer de instalar Zustand (`npm install zustand`) se não instalado
- **NÃO** criar API routes nesta story — o GET `/api/subscription` é Story 3.1

### Dependências entre Stories

| Story | Relação | Impacto |
|---|---|---|
| 1.1 (done) | Pré-requisito | Prisma schema, design system, ShadCN |
| 2.1 (ready-for-dev) | **Pré-requisito** | Auth.js, session, middleware auth |
| 3.1 (backlog) | **Pré-requisito CRÍTICO** | Stripe config, checkout, GET /api/subscription |
| 3.2 (backlog) | **Pré-requisito CRÍTICO** | Webhooks atualizam subscription status |
| 3.4 (backlog) | Dependente | Billing page usa PaymentBanner desta story |
| 4.1 (backlog) | Dependente | Chat interface usa gating desta story |
| 4.2 (backlog) | Dependente | Streaming usa requireSubscription guard |

### Project Structure Notes

- O gating é feito no `chat/layout.tsx` (Server Component) e NÃO no middleware
- Middleware continua apenas fazendo auth check → redirect para /login
- `subscription-store.ts` é o primeiro Zustand store do projeto — define o padrão para os demais
- `api-guards.ts` é reutilizável por todas as API routes que precisam de subscription
- PaymentBanner é componente compartilhado (`shared/`) pois será usado no chat E no billing
- A fonte de verdade para subscription status é SEMPRE o banco (Prisma), nunca o client

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.3 Acceptance Criteria, Epic 3 Overview, FR14/FR15 Coverage, Subscription Status State Machine]
- [Source: _bmad-output/planning-artifacts/architecture.md — Middleware Subscription Gating, API Boundaries (chat=Auth+Subscription), Error Code FORBIDDEN (403), Zustand Store Pattern, Server Action Pattern, Component Boundaries, Data Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — PaymentBanner Component (role="alert", anatomy, states), Journey 5 (Falha de Pagamento flow), Graceful Degradation Principle, Respect+Alternatives Pattern]
- [Source: _bmad-output/planning-artifacts/prd.md — FR14 (Período de graça), FR15 (Bloqueio pós-expiração), NFR9 (Dados pagamento via Stripe only)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Edge Runtime limitation: Prisma Client não funciona no middleware Next.js — gating via Server Component layout
- Zustand store é primeiro store do projeto — padrão deve ser seguido por chat-store e ui-store

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Decisão arquitectural documentada: Layout gating (Server Component) ao invés de middleware gating (Edge)
- Subscription state machine completa com regras de acesso por status
- PaymentBanner com especificações UX detalhadas (acessibilidade, cores, tom)
- Guard reutilizável `requireSubscription` para API routes futuras (Stories 4.x)
- Zustand subscription-store como primeiro store — define padrão para chat-store e ui-store
- Todos os textos UI em francês
- Story depende criticamente de 3.1 (Checkout) e 3.2 (Webhooks) — não pode ser implementada antes
- [DEV 2026-03-12] Todos os 7 arquivos criados com sucesso; lint passou; tsc sem erros nos arquivos desta story
- [DEV 2026-03-12] Zustand instalado (`npm install zustand`); primeiro Zustand store do projeto criado
- [DEV 2026-03-12] Erro pré-existente em pricing/page.tsx (Story 3.5, in-progress) — `openMultiple` prop inválida; não introduzido por esta story

### File List

- src/lib/subscription.ts (novo)
- src/lib/api-guards.ts (novo)
- src/app/(dashboard)/chat/layout.tsx (novo)
- src/components/shared/payment-banner.tsx (novo)
- src/components/shared/subscription-blocked.tsx (novo)
- src/stores/subscription-store.ts (novo)
- src/hooks/use-subscription.ts (novo)
- src/components/dashboard/payment-banner.tsx (novo — criado antecipando Story 3.4; Client Component com Stripe portal)
- src/app/api/subscription/route.ts (modificado — removido filtro notIn EXPIRED do GET; PATCH refatorado com rollback)
- package.json (modificado — zustand adicionado)
- package-lock.json (modificado — zustand instalado)

## Change Log

- 2026-03-12: Story 3.3 implementada — subscription gating via Server Component layout, PaymentBanner, SubscriptionBlockedPage, Zustand store, hook useSubscription, API guard requireSubscription criados. Zustand instalado como primeiro store do projeto.
- 2026-03-12: [CODE REVIEW] 8 issues corrigidos (4 HIGH, 4 MEDIUM) — useSubscription hook corrigido (API shape mismatch + isLoading reset + AbortController); api-guards.ts session.user.id null check; dashboard/payment-banner.tsx aria-live adicionado; subscription-blocked.tsx mensagem ACTIVE corrigida; checkSubscriptionAccess adicionado isCancelScheduled; GET /api/subscription removido filtro notIn EXPIRED.
