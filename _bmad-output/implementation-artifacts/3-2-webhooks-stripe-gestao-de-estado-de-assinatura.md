# Story 3.2: Webhooks Stripe & Gestão de Estado de Assinatura

Status: ready-for-dev

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

- [ ] Task 1: Adicionar modelo ProcessedStripeEvent ao Prisma (AC: #6, #10)
  - [ ] 1.1 Adicionar ao `prisma/schema.prisma`:
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
  - [ ] 1.2 Executar `npx prisma migrate dev --name add-processed-stripe-events` para aplicar migração

- [ ] Task 2: Implementar `src/lib/stripe.ts` com cliente Stripe (AC: #7)
  - [ ] 2.1 Substituir o placeholder com implementação completa:
    ```typescript
    import Stripe from 'stripe';

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',  // Usar versão mais recente disponível
      typescript: true,
    });
    ```
  - [ ] 2.2 Instalar pacote: `npm install stripe`
  - [ ] 2.3 Verificar `.env.example` já contém as variáveis necessárias: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID` (já documentadas no .env.example)

- [ ] Task 3: Criar handler principal do webhook (AC: #7, #8)
  - [ ] 3.1 Criar `src/app/api/webhooks/stripe/route.ts`:
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

      if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }

      // Idempotência: verificar se evento já foi processado
      const alreadyProcessed = await prisma.processedStripeEvent.findUnique({
        where: { eventId: event.id },
      });
      if (alreadyProcessed) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, event.id);
            break;
          case 'invoice.paid':
            await handleInvoicePaid(event.data.object as Stripe.Invoice, event.id);
            break;
          case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, event.id);
            break;
          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.id);
            break;
          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
            break;
          default:
            // Ignorar silenciosamente eventos desconhecidos (retornar 200 para evitar retry)
            await prisma.processedStripeEvent.create({
              data: { eventId: event.id, type: event.type },
            });
        }
      } catch (err) {
        console.error(`Error processing Stripe event ${event.type}:`, err);
        // Retornar 500 para que Stripe faça retry
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }

      return NextResponse.json({ received: true });
    }
    ```
  - [ ] 3.2 **CRÍTICO:** Verificar que o body parser NÃO processa o corpo da requisição antes do handler — no Next.js App Router, `req.text()` já retorna o body raw sem parsing automático (correto por padrão)

- [ ] Task 4: Implementar handler `checkout.session.completed` (AC: #1)
  - [ ] 4.1 Criar `src/app/api/webhooks/stripe/handlers/checkout-completed.ts`:
    ```typescript
    import Stripe from 'stripe';
    import { prisma } from '@/lib/prisma';
    import { stripe } from '@/lib/stripe';

    export async function handleCheckoutCompleted(
      session: Stripe.Checkout.Session,
      eventId: string
    ) {
      if (session.mode !== 'subscription') return;

      const stripeSubscriptionId = session.subscription as string;
      const stripeCustomerId = session.customer as string;
      const userId = session.metadata?.userId;
      const specialistId = session.metadata?.specialistId;

      if (!userId || !specialistId || !stripeSubscriptionId) {
        console.error('Missing metadata in checkout.session.completed', { userId, specialistId, stripeSubscriptionId });
        return;
      }

      // Buscar detalhes completos da subscription no Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: { stripeSubscriptionId },
          create: {
            userId,
            specialistId,
            stripeSubscriptionId,
            stripeCustomerId,
            status: 'ACTIVE',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
          update: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        }),
        prisma.processedStripeEvent.create({
          data: { eventId, type: 'checkout.session.completed' },
        }),
      ]);
    }
    ```
  - [ ] 4.2 **CRÍTICO:** Os metadados `userId` e `specialistId` DEVEM ser passados ao criar a Checkout Session na Story 3.1. Verificar `session.metadata` antes de usar

- [ ] Task 5: Implementar handler `invoice.paid` (AC: #2)
  - [ ] 5.1 Criar `src/app/api/webhooks/stripe/handlers/invoice-paid.ts`:
    ```typescript
    import Stripe from 'stripe';
    import { prisma } from '@/lib/prisma';

    export async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
      const stripeSubscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

      if (!stripeSubscriptionId) return;

      const periodStart = invoice.period_start;
      const periodEnd = invoice.period_end;

      await prisma.$transaction([
        prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(periodStart * 1000),
            currentPeriodEnd: new Date(periodEnd * 1000),
          },
        }),
        prisma.processedStripeEvent.create({
          data: { eventId, type: 'invoice.paid' },
        }),
      ]);
    }
    ```

- [ ] Task 6: Implementar handler `invoice.payment_failed` (AC: #3)
  - [ ] 6.1 Criar `src/app/api/webhooks/stripe/handlers/invoice-payment-failed.ts`:
    ```typescript
    import Stripe from 'stripe';
    import { prisma } from '@/lib/prisma';

    export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, eventId: string) {
      const stripeSubscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

      if (!stripeSubscriptionId) return;

      await prisma.$transaction([
        prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: { status: 'PAST_DUE' },
        }),
        prisma.processedStripeEvent.create({
          data: { eventId, type: 'invoice.payment_failed' },
        }),
      ]);
    }
    ```

- [ ] Task 7: Implementar handler `customer.subscription.updated` (AC: #5)
  - [ ] 7.1 Criar `src/app/api/webhooks/stripe/handlers/subscription-updated.ts`:
    ```typescript
    import Stripe from 'stripe';
    import { SubscriptionStatus } from '@prisma/client';
    import { prisma } from '@/lib/prisma';

    function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
      switch (stripeStatus) {
        case 'active': return 'ACTIVE';
        case 'past_due': return 'PAST_DUE';
        case 'canceled': return 'CANCELED';
        case 'unpaid': return 'PAST_DUE';
        case 'trialing': return 'ACTIVE';
        default: return 'PENDING';
      }
    }

    export async function handleSubscriptionUpdated(
      subscription: Stripe.Subscription,
      eventId: string
    ) {
      const stripeSubscriptionId = subscription.id;

      await prisma.$transaction([
        prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: mapStripeStatus(subscription.status),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        }),
        prisma.processedStripeEvent.create({
          data: { eventId, type: 'customer.subscription.updated' },
        }),
      ]);
    }
    ```

- [ ] Task 8: Implementar handler `customer.subscription.deleted` (AC: #4)
  - [ ] 8.1 Criar `src/app/api/webhooks/stripe/handlers/subscription-deleted.ts`:
    ```typescript
    import Stripe from 'stripe';
    import { prisma } from '@/lib/prisma';

    export async function handleSubscriptionDeleted(
      subscription: Stripe.Subscription,
      eventId: string
    ) {
      const stripeSubscriptionId = subscription.id;

      await prisma.$transaction([
        prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: { status: 'CANCELED' },
        }),
        prisma.processedStripeEvent.create({
          data: { eventId, type: 'customer.subscription.deleted' },
        }),
      ]);
    }
    ```

- [ ] Task 9: Configurar webhook na Stripe Dashboard (AC: #7)
  - [ ] 9.1 No Stripe Dashboard (ou via Stripe CLI para dev local), registrar o endpoint:
    - URL: `https://seu-dominio.com/api/webhooks/stripe`
    - Para desenvolvimento local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  - [ ] 9.2 Selecionar os eventos a receber:
    - `checkout.session.completed`
    - `invoice.paid`
    - `invoice.payment_failed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
  - [ ] 9.3 Copiar o `STRIPE_WEBHOOK_SECRET` (whsec_...) para `.env.local`
  - [ ] 9.4 Para CI/CD: adicionar `STRIPE_WEBHOOK_SECRET` nas variáveis de ambiente do Vercel

- [ ] Task 10: Validação final (AC: todos)
  - [ ] 10.1 `npm run lint` sem erros
  - [ ] 10.2 `npx tsc --noEmit` sem erros TypeScript
  - [ ] 10.3 Testar `checkout.session.completed` via Stripe CLI: `stripe trigger checkout.session.completed` → Subscription criada no DB com status ACTIVE
  - [ ] 10.4 Testar `invoice.paid` via Stripe CLI: `stripe trigger invoice.paid` → Subscription atualizada com novo período
  - [ ] 10.5 Testar `invoice.payment_failed` via Stripe CLI: `stripe trigger invoice.payment_failed` → status muda para PAST_DUE
  - [ ] 10.6 Testar `customer.subscription.deleted` via Stripe CLI: `stripe trigger customer.subscription.deleted` → status muda para CANCELED
  - [ ] 10.7 Testar idempotência: enviar o mesmo evento duas vezes → segundo processamento retorna 200 sem duplicar entrada em ProcessedStripeEvent
  - [ ] 10.8 Testar assinatura inválida: enviar payload com header `stripe-signature` corrompido → retorna 400
  - [ ] 10.9 Verificar que eventos desconhecidos (ex: `charge.succeeded`) são ignorados com retorno 200
  - [ ] 10.10 Testar em modo test do Stripe com cartão `4242 4242 4242 4242` (sucesso) e `4000 0000 0000 9995` (falha de pagamento)

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
// currentPeriodStart/End: buscar via stripe.subscriptions.retrieve()
```

**`invoice.paid` e `invoice.payment_failed`:**
```typescript
invoice.subscription   // "sub_xxx" - para encontrar Subscription no DB
invoice.period_start   // Unix timestamp - novo período (paid)
invoice.period_end     // Unix timestamp - novo período (paid)
```

**`customer.subscription.updated` e `customer.subscription.deleted`:**
```typescript
subscription.id                     // "sub_xxx" - stripeSubscriptionId
subscription.status                 // "active" | "past_due" | "canceled" | etc.
subscription.current_period_start   // Unix timestamp
subscription.current_period_end     // Unix timestamp
subscription.cancel_at_period_end   // boolean
```

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

### Completion Notes List

- Story 3.2 implementa o "coração" do sistema de pagamento: sincronização bidirecional Stripe ↔ DB
- Handler organizado em ficheiros separados por evento — testável e manutenível
- Idempotência via ProcessedStripeEvent — NFR18 satisfeito
- Período de graça gerido pelo Stripe (retry schedule) — nossa implementação apenas sincroniza status
- `stripe.ts` placeholder implementado nesta story (3.1 ainda é backlog mas placeholder existe)
- CRÍTICO: Story 3.1 DEVE passar `metadata.userId` e `metadata.specialistId` na Checkout Session
- Stripe CLI comandos documentados para facilitar testes locais sem Stripe Dashboard
- 5 eventos tratados: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted

### File List

