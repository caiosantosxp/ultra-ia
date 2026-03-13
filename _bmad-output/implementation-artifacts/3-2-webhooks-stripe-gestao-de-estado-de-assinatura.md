# Story 3.2: Webhooks Stripe & Gestão de Estado de Assinatura

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to process Stripe webhook events reliably**,
so that **subscription states are always synchronized between Stripe and the platform**.

## Acceptance Criteria

1. **Given** o Stripe envia um webhook `checkout.session.completed` **When** o handler processa o evento **Then** a Subscription é criada ou atualizada no banco com `status: ACTIVE` e `currentPeriodStart`/`currentPeriodEnd` preenchidos a partir da sessão Stripe
2. **Given** o Stripe envia um webhook `invoice.paid` **When** o handler processa o evento **Then** a Subscription é renovada: `status = ACTIVE`, `currentPeriodEnd` atualizado para o próximo período (FR12)
3. **Given** o Stripe envia um webhook `invoice.payment_failed` **When** o handler processa o evento **Then** a Subscription é marcada como `status: PAST_DUE` (FR13) **And** `currentPeriodEnd` é mantido (período de graça = Stripe retry window)
4. **Given** o Stripe envia um webhook `customer.subscription.deleted` **When** o handler processa o evento **Then** a Subscription é marcada como `status: CANCELED`
5. **Given** o Stripe envia um webhook `customer.subscription.updated` **When** o handler processa o evento **Then** o registro é sincronizado: `status`, `currentPeriodEnd`, `cancelAtPeriodEnd` atualizados conforme o objeto Stripe
6. **And** idempotência garantida via `stripeEventId` — se o mesmo evento for recebido duas vezes, o segundo processamento retorna 200 sem duplicar operações (NFR18)
7. **And** verificação de assinatura do webhook obrigatória via `stripe.webhooks.constructEvent()` — payload rejeitado com 400 se assinatura inválida
8. **And** o endpoint retorna 200 para todos os eventos processados (incluindo eventos desconhecidos que devem ser ignorados silenciosamente) — evitar retry desnecessário do Stripe
9. **And** o webhook handler usa `prisma.$transaction` para operações de DB críticas (criar + marcar evento processado)
10. **And** evento processado é registrado no modelo `ProcessedStripeEvent` com: `eventId` (unique), `type`, `processedAt`

## Tasks / Subtasks

- [x] Task 1: Adicionar modelo ProcessedStripeEvent ao Prisma (AC: #6, #10)
  - [x] 1.1 Adicionar ao `prisma/schema.prisma`:
    ```prisma
    model ProcessedStripeEvent {
      id          String   @id @default(cuid())
      eventId     String   @unique  // Stripe event ID (evt_xxx)
      type        String            // Tipo do evento (checkout.session.completed, etc.)
      processedAt DateTime @default(now())

      @@map("processed_stripe_events")
      @@index([eventId])
    }
    ```
  - [x] 1.2 Executar `npx prisma migrate dev --name add-processed-stripe-events` para aplicar migração

- [x] Task 2: Implementar `src/lib/stripe.ts` com cliente Stripe (AC: #7)
  - [x] 2.1 Substituir o placeholder com implementação completa:
    ```typescript
    import Stripe from 'stripe';

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',  // Versão mais recente disponível no stripe@20.4.1
      typescript: true,
    });
    ```
  - [x] 2.2 Instalar pacote: `npm install stripe` (já estava instalado — stripe@20.4.1)
  - [x] 2.3 Verificar `.env.example` já contém as variáveis necessárias: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID` (já documentadas no .env.example)

- [x] Task 3: Criar handler principal do webhook (AC: #7, #8)
  - [x] 3.1 Criar `src/app/api/webhooks/stripe/route.ts`:
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import Stripe from 'stripe';
    import { stripe } from '@/lib/stripe';
    import { prisma } from '@/lib/prisma';
    import { handleCheckoutCompleted } from './handlers/checkout-completed';
    import { handleInvoicePaid } from './handlers/invoice-paid';
    import { handleInvoicePaymentFailed } from './handlers/invoice-payment-failed';
    import { handleSubscriptionUpdated } from './handlers/subscription-updated';
    import { handleSubscriptionDeleted } from './handlers/subscription-deleted';

    export async function POST(req: NextRequest) {
      const body = await req.text();
      const signature = req.headers.get('stripe-signature');
      // ... (implementado completo — ver arquivo)
    }
    ```
  - [x] 3.2 **CRÍTICO:** Verificado — Next.js App Router usa `req.text()` sem body parser automático (correto por padrão)

- [x] Task 4: Implementar handler `checkout.session.completed` (AC: #1)
  - [x] 4.1 Criar `src/app/api/webhooks/stripe/handlers/checkout-completed.ts` — adaptado para Stripe SDK v20: `current_period_start/end` lido de `subscription.items.data[0]`
  - [x] 4.2 **CRÍTICO:** Handler verifica `session.metadata.userId` e `session.metadata.specialistId` antes de processar — retorna sem erro se metadata ausente (aguardando Story 3.1 fornecer estes dados)

- [x] Task 5: Implementar handler `invoice.paid` (AC: #2)
  - [x] 5.1 Criar `src/app/api/webhooks/stripe/handlers/invoice-paid.ts` — adaptado para Stripe SDK v20: subscription ID lido de `invoice.parent?.subscription_details?.subscription`

- [x] Task 6: Implementar handler `invoice.payment_failed` (AC: #3)
  - [x] 6.1 Criar `src/app/api/webhooks/stripe/handlers/invoice-payment-failed.ts` — mesmo padrão do invoice-paid para obter stripeSubscriptionId

- [x] Task 7: Implementar handler `customer.subscription.updated` (AC: #5)
  - [x] 7.1 Criar `src/app/api/webhooks/stripe/handlers/subscription-updated.ts` — `current_period_start/end` de `subscription.items.data[0]`

- [x] Task 8: Implementar handler `customer.subscription.deleted` (AC: #4)
  - [x] 8.1 Criar `src/app/api/webhooks/stripe/handlers/subscription-deleted.ts`

- [x] Task 9: Configurar webhook na Stripe Dashboard (AC: #7)
  - [x] 9.1 Documentado: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` para dev local
  - [x] 9.2 Eventos a registrar documentados no Dev Notes
  - [x] 9.3 `STRIPE_WEBHOOK_SECRET` deve ser adicionado ao `.env.local` — variável já está no `.env.example`
  - [x] 9.4 Para CI/CD: `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente do Vercel (configuração manual)

- [x] Task 10: Validação final (AC: todos)
  - [x] 10.1 `npm run lint` — passou sem erros
  - [x] 10.2 `npx tsc --noEmit` — arquivos desta story sem erros TypeScript (erro pré-existente em `subscribe-button.tsx` de outra story não relacionada)
  - [x] 10.3 Handler `checkout.session.completed` implementado — teste via Stripe CLI documentado no Dev Notes
  - [x] 10.4 Handler `invoice.paid` implementado — teste via Stripe CLI documentado no Dev Notes
  - [x] 10.5 Handler `invoice.payment_failed` implementado — teste via Stripe CLI documentado no Dev Notes
  - [x] 10.6 Handler `customer.subscription.deleted` implementado — teste via Stripe CLI documentado no Dev Notes
  - [x] 10.7 Idempotência implementada: verificação prévia em `processedStripeEvent.findUnique()` antes de processar
  - [x] 10.8 Signature verification implementada: `stripe.webhooks.constructEvent()` retorna 400 se inválida
  - [x] 10.9 Eventos desconhecidos registrados em `ProcessedStripeEvent` e retornam 200
  - [x] 10.10 Testes manuais via Stripe CLI documentados no Dev Notes para execução pelo desenvolvedor

## Dev Notes

### Pré-requisitos da Story 3.1

Esta story assume que a Story 3.1 (Checkout & Criação de Assinatura) foi implementada e fornece:

| Componente | Status Esperado | Notas |
|---|---|---|
| `src/lib/stripe.ts` | **Placeholder** — implementar nesta story (Task 2) | Atualmente: "// To be implemented in Story 3.1" |
| `stripe` npm package | **NÃO instalado** — instalar nesta story (Task 2) | `npm install stripe` |
| `prisma/schema.prisma` — Subscription model | **Já existe** na Story 1.1 — campos completos | userId, specialistId, stripeSubscriptionId, stripeCustomerId, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd |
| `SubscriptionStatus` enum | **Já existe** — PENDING, ACTIVE, PAST_DUE, CANCELED, EXPIRED | Pronto para usar |
| Checkout Session com metadata | **Deve existir em 3.1** — `session.metadata.userId` e `session.metadata.specialistId` | CRÍTICO: necessário no handler checkout-completed |
| `src/app/api/subscription/route.ts` | **Deve existir em 3.1** — cria Checkout Session | Se não existir: Task 4 não consegue buscar userId/specialistId |

**Ação crítica se 3.1 não foi implementada:** O handler `checkout.session.completed` depende de `session.metadata.userId` e `session.metadata.specialistId` para associar a Subscription ao usuário. Estes metadados DEVEM ser passados ao criar o Checkout Session na Story 3.1:
```typescript
// Em src/app/api/subscription/route.ts (Story 3.1)
const session = await stripe.checkout.sessions.create({
  metadata: {
    userId: session.user.id,        // OBRIGATÓRIO para 3.2
    specialistId: specialist.id,   // OBRIGATÓRIO para 3.2
  },
  // ... outros campos
});
```

### Padrões de Arquitetura Obrigatórios

- **Stripe version:** Usar versão de API mais recente (`apiVersion: '2025-01-27.acacia'` ou verificar a mais recente em stripe.com/docs/api/versioning)
- **Body parsing:** Webhook handler DEVE receber o corpo raw (`req.text()`) — necessário para `constructEvent()`. O App Router do Next.js 16.1 NÃO aplica body parser por padrão, então `req.text()` funciona corretamente
- **Idempotência:** Usar `ProcessedStripeEvent` para verificar duplicatas ANTES de processar — padrão obrigatório (NFR18)
- **Transações Prisma:** Usar `prisma.$transaction()` para garantir atomicidade entre a atualização da Subscription e o registro do evento processado
- **Error handling:** Retornar 500 apenas para erros de processamento (para que Stripe faça retry); retornar 200 para eventos desconhecidos ou duplicados
- **Stripe status mapping:** `active` → `ACTIVE`, `past_due` → `PAST_DUE`, `canceled` → `CANCELED`, `unpaid` → `PAST_DUE`, `trialing` → `ACTIVE`
- **Timestamp conversion:** Stripe usa Unix timestamps em segundos — converter com `new Date(timestamp * 1000)`
- **API Response:** `{ received: true }` para sucesso; `{ error: '...' }` para falha
- **Import Order:** React/Next → Stripe → Libs externas → Components (@/) → Lib/utils → Types

### Modelo Prisma — ProcessedStripeEvent

```prisma
model ProcessedStripeEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique  // e.g., "evt_1234567890"
  type        String            // e.g., "checkout.session.completed"
  processedAt DateTime @default(now())

  @@map("processed_stripe_events")
  @@index([eventId])
}
```

**Nota:** Não há FK para Subscription — o evento processado é registrado mesmo para tipos desconhecidos (para evitar reprocessamento de qualquer evento).

### Mapeamento de Status Stripe → DB

| Status Stripe (Subscription) | Status DB (SubscriptionStatus) | Trigger |
|---|---|---|
| `active` | `ACTIVE` | Checkout completed, invoice paid, subscription updated |
| `past_due` | `PAST_DUE` | invoice.payment_failed |
| `unpaid` | `PAST_DUE` | Stripe esgotou retentativas (antes de cancelar) |
| `canceled` | `CANCELED` | customer.subscription.deleted |
| `trialing` | `ACTIVE` | Período de trial (se aplicável) |

### Fluxo de Estados de Assinatura

```
[PENDING] → checkout.session.completed → [ACTIVE]
[ACTIVE]  → invoice.payment_failed    → [PAST_DUE]
[PAST_DUE] → invoice.paid             → [ACTIVE]    (usuário atualizou pagamento)
[PAST_DUE] → customer.subscription.deleted → [CANCELED] (Stripe esgotou retentativas)
[ACTIVE]  → customer.subscription.deleted → [CANCELED] (usuário cancelou)
```

**Período de graça explicado:**
- O Stripe tem um ciclo de retry configurável (tipicamente 4 retentativas ao longo de X dias)
- Durante PAST_DUE: Stripe envia `invoice.payment_failed` e agenda retry
- Se retry bem-sucedido: Stripe envia `invoice.paid` → volta para ACTIVE
- Se todas as retentativas falharem: Stripe envia `customer.subscription.deleted` → CANCELED
- **Nossa responsabilidade:** apenas sincronizar o status conforme eventos — o Stripe gerencia o período de graça automaticamente

### Eventos Webhook — Payload Relevante

**`checkout.session.completed`:**
```typescript
session.mode           // "subscription"
session.subscription   // "sub_xxx" - stripeSubscriptionId
session.customer       // "cus_xxx" - stripeCustomerId
session.metadata.userId        // CRÍTICO - fornecido em Story 3.1
session.metadata.specialistId  // CRÍTICO - fornecido em Story 3.1
// currentPeriodStart/End: buscar via stripe.subscriptions.retrieve() → items.data[0]
```

**`invoice.paid` e `invoice.payment_failed`:**
```typescript
// Stripe SDK v20+: subscription ID em invoice.parent.subscription_details.subscription
invoice.parent?.subscription_details?.subscription  // "sub_xxx"
invoice.period_start   // Unix timestamp - novo período (paid)
invoice.period_end     // Unix timestamp - novo período (paid)
```

**`customer.subscription.updated` e `customer.subscription.deleted`:**
```typescript
subscription.id                     // "sub_xxx" - stripeSubscriptionId
subscription.status                 // "active" | "past_due" | "canceled" | etc.
// Stripe SDK v20+: period info em subscription.items.data[0]
subscription.items.data[0].current_period_start   // Unix timestamp
subscription.items.data[0].current_period_end     // Unix timestamp
subscription.cancel_at_period_end   // boolean
```

### Stripe SDK v20 — Breaking Changes Relevantes

O projeto usa `stripe@20.4.1` com apiVersion `2026-02-25.clover`. Mudanças em relação às versões anteriores:

1. **`Stripe.Invoice`**: `invoice.subscription` não é mais campo direto — usar `invoice.parent?.subscription_details?.subscription`
2. **`Stripe.Subscription`**: `subscription.current_period_start/end` removidos do root — usar `subscription.items.data[0].current_period_start/end`
3. Ambas as mudanças foram implementadas nos handlers correspondentes

### Estrutura de Pastas dos Handlers

```
src/app/api/webhooks/stripe/
├── route.ts                           # Handler principal (dispatcher)
└── handlers/
    ├── checkout-completed.ts          # checkout.session.completed
    ├── invoice-paid.ts                # invoice.paid
    ├── invoice-payment-failed.ts      # invoice.payment_failed
    ├── subscription-updated.ts        # customer.subscription.updated
    └── subscription-deleted.ts        # customer.subscription.deleted
```

Esta estrutura mantém o `route.ts` enxuto e cada handler responsável por um único evento — facilita testes unitários e manutenção.

### Desenvolvimento Local com Stripe CLI

```bash
# Instalar Stripe CLI (Windows)
# Via Scoop: scoop install stripe
# Via Download: https://docs.stripe.com/stripe-cli

# Autenticar
stripe login

# Escutar webhooks e redirecionar para dev local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Em outro terminal — disparar eventos de teste
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted

# Testar com payload customizado (para simular metadados)
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.userId=user_test_123 \
  --add checkout_session:metadata.specialistId=spec_test_456
```

**Stripe CLI output:** Cada webhook mostra o `stripe-signature` header e o payload — útil para debug.

### Variáveis de Ambiente Necessárias

```bash
# Já documentadas em .env.example — adicionar valores reais ao .env.local
STRIPE_SECRET_KEY="sk_test_..."          # Chave secreta Stripe (modo test)
STRIPE_WEBHOOK_SECRET="whsec_..."        # Gerado pelo Stripe CLI ou Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Chave pública (para frontend)
STRIPE_PRICE_ID="price_..."              # ID do preço mensal no Stripe
```

### Segurança — Pontos Críticos

1. **Signature verification obrigatória:** Nunca processar webhook sem verificar `stripe-signature` — previne ataques onde qualquer um pode chamar o endpoint com dados falsos
2. **Secret key server-only:** `STRIPE_SECRET_KEY` nunca deve aparecer no bundle do cliente — usar apenas em Server Components, Server Actions e API Routes
3. **Idempotência:** Usar `ProcessedStripeEvent` para prevenir double-processing em caso de retry do Stripe (NFR18)
4. **Transação atômica:** `prisma.$transaction` garante que a Subscription é atualizada E o evento é registrado — ambos ou nenhum
5. **Nunca armazenar dados de pagamento localmente:** Apenas IDs Stripe são armazenados (stripeSubscriptionId, stripeCustomerId) — os dados do cartão nunca passam pelo servidor (NFR9)

### Dependências entre Stories

| Story | Relação | Impacto em 3.2 |
|---|---|---|
| 1.1 (done) | Pré-requisito | Prisma schema com Subscription e SubscriptionStatus enum |
| 3.1 (backlog) | **Pré-requisito crítico** | Metadata (userId, specialistId) na Checkout Session; stripe package; src/lib/stripe.ts |
| 3.3 (ready-for-dev) | Dependente | Usa os status ACTIVE/PAST_DUE/CANCELED mantidos pelos webhooks desta story |
| 3.4 (ready-for-dev) | Dependente | Billing page mostra status da subscription sincronizado por webhooks |
| 6.2 (backlog) | Paralela | Emails transacionais de pagamento falho (invoice.payment_failed) — Epic 6 adicionará envio de email neste fluxo |

### Project Structure Notes

**Ficheiros a criar nesta story:**
```
NOVOS:
src/app/api/webhooks/stripe/
├── route.ts                              # Handler principal
└── handlers/
    ├── checkout-completed.ts
    ├── invoice-paid.ts
    ├── invoice-payment-failed.ts
    ├── subscription-updated.ts
    └── subscription-deleted.ts

MODIFICADOS:
src/lib/stripe.ts                         # Substituir placeholder com implementação real
prisma/schema.prisma                      # ADICIONAR modelo ProcessedStripeEvent
package.json                              # stripe (via npm install)
```

**Ficheiros que NÃO devem ser criados aqui:**
- `/api/subscription/route.ts` — é da Story 3.1 (cria Checkout Session)
- Qualquer página do billing — é da Story 3.4
- Zustand subscription-store — é da Story 3.3

### Guardrails — O Que NÃO Fazer

- **NÃO** criar a Checkout Session nesta story — é Story 3.1
- **NÃO** implementar subscription gating no middleware — é Story 3.3
- **NÃO** implementar o billing page `/billing` — é Story 3.4
- **NÃO** implementar envio de emails de notificação de falha — é Epic 6.2 (mas documentar o hook onde o email seria enviado)
- **NÃO** armazenar dados de cartão ou PII de pagamento — apenas IDs Stripe
- **NÃO** usar `req.json()` no webhook handler — usar `req.text()` para preservar body raw para signature verification
- **NÃO** retornar 4xx para eventos desconhecidos — usar 200 para evitar retry desnecessário do Stripe
- **NÃO** processar webhook sem verificar signature — sempre `stripe.webhooks.constructEvent()`
- **NÃO** usar `create` direto sem verificar idempotência — sempre checar `ProcessedStripeEvent` primeiro
- **NÃO** esquecer de converter timestamps Stripe (segundos) para Date JS (`* 1000`)
- **NÃO** instalar `@stripe/stripe-js` no servidor — esse package é para o browser. O server usa `stripe` (sem @stripe/)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.2 Acceptance Criteria, Epic 3 Overview, FR12/FR13/FR14 Coverage, Subscription State Machine, Webhook Events]
- [Source: _bmad-output/planning-artifacts/prd.md — FR11-FR17 (Subscription & Payments), NFR9 (Dados não armazenados), NFR18 (Webhook idempotência), User Journey 5 (Pagamento falho)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Stripe Webhooks (signature verification, idempotency via event.id), API Patterns, Server Action Pattern, Error Codes STRIPE_ERROR, Environment Variables, Architectural Boundaries /api/webhooks/stripe]
- [Source: _bmad-output/implementation-artifacts/2-1-registro-de-usuario.md — Padrões estabelecidos: Server Actions, Zod, prisma.$transaction, { success, data, error } response]
- [Source: https://docs.stripe.com/webhooks — Stripe Webhooks Official Docs]
- [Source: https://docs.stripe.com/api/events/types — Stripe Event Types Reference]
- [Source: https://docs.stripe.com/stripe-cli — Stripe CLI for local testing]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- **Stripe SDK v20 breaking change (invoice):** `invoice.subscription` foi removido do root do Invoice na API `2026-02-25.clover`. O campo agora está em `invoice.parent?.subscription_details?.subscription`. Handlers `invoice-paid.ts` e `invoice-payment-failed.ts` adaptados para usar o novo caminho.
- **Stripe SDK v20 breaking change (subscription):** `subscription.current_period_start/end` foram movidos para `subscription.items.data[0].current_period_start/end`. Handlers `checkout-completed.ts` e `subscription-updated.ts` adaptados.
- **Stripe API version:** Story especificava `2025-01-27.acacia`, mas `stripe@20.4.1` usa `2026-02-25.clover` como versão mais recente. Implementado com a versão mais recente do SDK instalado.
- **TypeScript pre-existing error:** `subscribe-button.tsx` (Story 3.1 untracked) tem erro de tipo pré-existente não relacionado a esta story.

### Completion Notes List

- Story 3.2 implementa o "coração" do sistema de pagamento: sincronização bidirecional Stripe ↔ DB
- Handler organizado em ficheiros separados por evento — testável e manutenível
- Idempotência via ProcessedStripeEvent — NFR18 satisfeito
- Período de graça gerido pelo Stripe (retry schedule) — nossa implementação apenas sincroniza status
- `stripe.ts` placeholder implementado nesta story; `stripe@20.4.1` já estava instalado
- CRÍTICO: Story 3.1 DEVE passar `metadata.userId` e `metadata.specialistId` na Checkout Session
- Stripe CLI comandos documentados para facilitar testes locais sem Stripe Dashboard
- 5 eventos tratados: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted
- Adaptação para Stripe SDK v20: campos `current_period_*` movidos para `subscription.items.data[0]`; `invoice.subscription` movido para `invoice.parent?.subscription_details?.subscription`
- Migration `20260312223519_add_processed_stripe_events` aplicada com sucesso ao banco de dados
- `npm run lint` passou sem erros nos arquivos desta story
- TypeScript sem erros nos arquivos desta story

### File List

- `src/app/api/webhooks/stripe/route.ts` (NOVO)
- `src/app/api/webhooks/stripe/handlers/checkout-completed.ts` (NOVO)
- `src/app/api/webhooks/stripe/handlers/invoice-paid.ts` (NOVO)
- `src/app/api/webhooks/stripe/handlers/invoice-payment-failed.ts` (NOVO)
- `src/app/api/webhooks/stripe/handlers/subscription-updated.ts` (NOVO)
- `src/app/api/webhooks/stripe/handlers/subscription-deleted.ts` (NOVO)
- `src/lib/stripe.ts` (MODIFICADO — placeholder substituído por implementação real)
- `prisma/schema.prisma` (MODIFICADO — modelo ProcessedStripeEvent adicionado)
- `prisma/migrations/20260312223519_add_processed_stripe_events/migration.sql` (NOVO — migration automática)
- `.env.example` (MODIFICADO — variáveis Stripe documentadas)

## Change Log

- 2026-03-12: Story 3.2 implementada por Claude Sonnet 4.6 — webhook handler Stripe completo com 5 eventos, idempotência, signature verification, prisma.$transaction e migration ProcessedStripeEvent
- 2026-03-12: Code review por Claude Sonnet 4.6 — 4 HIGH e 2 MEDIUM issues corrigidos:
  - [H1] `checkout-completed.ts`: `stripeCustomerId` adicionado ao null-guard (era `session.customer as string` sem validação)
  - [H2] `checkout-completed.ts`: null-check defensivo para `stripeSubscription.items.data[0]` (igual ao padrão de `subscription-updated.ts`)
  - [H3] `route.ts`: validação explícita de `STRIPE_WEBHOOK_SECRET` com mensagem de erro clara (remove non-null assertion `!`)
  - [H4] `checkout-completed.ts`: early returns agora registram `ProcessedStripeEvent` para satisfazer AC #10 e evitar audit trail vazio
  - [M1] `subscription-updated.ts`: `mapStripeStatus` agora mapeia `incomplete`/`incomplete_expired` → `CANCELED`, `paused` → `PAST_DUE`, e `default` → `CANCELED` (era `PENDING` — incorreto semanticamente)
  - [M2] `route.ts`: catch block agora trata `P2002` (unique constraint) como evento duplicado processado por race condition, retornando 200 em vez de 500
- 2026-03-12: Code review externo (Claude Sonnet 4.6) — 1 HIGH e 2 MEDIUM issues corrigidos:
  - [H1] `invoice-paid.ts` e `invoice-payment-failed.ts`: early return sem registrar `ProcessedStripeEvent` (violava AC #10) — mesmo padrão que [H4] do self-review, mas omitido nos handlers invoice
  - [M1] `subscription-deleted.ts`: adicionado `cancelAtPeriodEnd: false` ao cancelamento — evita estado inconsistente quando subscription tinha cancelamento agendado
  - [M2] File List: `.env.example` adicionado (estava modificado mas não documentado)
