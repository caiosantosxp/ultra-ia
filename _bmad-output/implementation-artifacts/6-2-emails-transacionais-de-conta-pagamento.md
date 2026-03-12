# Story 6.2: Emails Transacionais de Conta & Pagamento

Status: ready-for-dev

## Story

Como um **usuário**,
Eu quero **receber notificações por email sobre eventos importantes de conta e pagamento**,
Para que **eu fique informado sobre o status da minha assinatura e possa agir quando necessário**.

## Acceptance Criteria

1. **Email de Boas-vindas (FR39)**
   - Dado que um novo usuário completa o registro com sucesso
   - Quando a conta é criada via `register` server action (Story 2.1)
   - Então um email de boas-vindas é enviado com: saudação personalizada (nome do usuário), próximos passos, link para o dashboard
   - E o envio é disparado de forma assíncrona para não bloquear o fluxo de registro

2. **Email de Confirmação de Assinatura (FR40)**
   - Dado que um usuário completa o checkout e a assinatura é ativada
   - Quando o webhook `checkout.session.completed` é processado no handler `POST /api/webhooks/stripe` (Story 3.2)
   - Então um email de confirmação é enviado com: nome do especialista, valor da assinatura, data de próxima cobrança, link para o chat
   - E o email só é enviado após a assinatura estar confirmada no banco de dados

3. **Email de Falha de Pagamento (FR41)**
   - Dado que o pagamento de renovação de um assinante falha
   - Quando o webhook `invoice.payment_failed` é processado no handler do Stripe (Story 3.2)
   - Então um email de alerta é enviado com: explicação da falha, prazo do período de graça, CTA "Mettre à jour le paiement" linkando para `/billing`
   - E o email inclui o valor que não foi cobrado

4. **Email de Confirmação de Pagamento Atualizado (FR42)**
   - Dado que um assinante atualiza seu método de pagamento com sucesso
   - Quando o webhook `invoice.payment_succeeded` é processado (após período de falha)
   - Então um email de confirmação é enviado com: confirmação do pagamento, próxima data de cobrança, link para o chat

5. **Conformidade Técnica e RGPD (todos os emails)**
   - Todos os emails são disparados via server actions ou webhook handlers existentes (NUNCA via cron jobs)
   - Cada template usa variáveis tipadas com Zod (userName, specialistName, amount, nextBillingDate, etc.)
   - Todos os emails incluem link de gestão de preferências (conformidade RGPD, NFR11)
   - Conteúdo em francês, consistente com a interface da plataforma
   - Remetente padronizado: "ultra-ia <noreply@ultra-ia.com>"

## Tasks / Subtasks

- [ ] Task 1: Criar templates de email HTML (AC: #1, #2, #3, #4, #5)
  - [ ] 1.1 Criar `src/lib/email-templates/welcome.ts` — template de boas-vindas com variáveis tipadas
  - [ ] 1.2 Criar `src/lib/email-templates/subscription-confirmed.ts` — confirmação de assinatura
  - [ ] 1.3 Criar `src/lib/email-templates/payment-failed.ts` — alerta de falha de pagamento com CTA billing
  - [ ] 1.4 Criar `src/lib/email-templates/payment-succeeded.ts` — confirmação de pagamento atualizado
  - [ ] 1.5 Criar `src/lib/validations/email.ts` — Zod schemas para cada template de variáveis
  - [ ] 1.6 Criar `src/types/email.ts` — tipos TypeScript para templates e variáveis

- [ ] Task 2: Integrar email de boas-vindas no fluxo de registro (AC: #1)
  - [ ] 2.1 Localizar `src/actions/auth-actions.ts` e encontrar a função `register` (Story 2.1)
  - [ ] 2.2 Após criação bem-sucedida do usuário no Prisma, chamar `sendEmail({ to, template: 'welcome', variables })`
  - [ ] 2.3 Garantir que falha no envio de email NÃO bloqueia o registro (try/catch separado com log Sentry)
  - [ ] 2.4 Escrever testes para: email disparado no registro, falha de email não afeta registro

- [ ] Task 3: Integrar emails nos webhooks Stripe (AC: #2, #3, #4)
  - [ ] 3.1 Localizar `src/app/api/webhooks/stripe/route.ts` (Story 3.2)
  - [ ] 3.2 No handler de `checkout.session.completed`: buscar dados do usuário e especialista no Prisma, disparar email de confirmação
  - [ ] 3.3 No handler de `invoice.payment_failed`: buscar dados do usuário, disparar email de falha com link `/billing`
  - [ ] 3.4 Adicionar handler para `invoice.payment_succeeded` (ou reusar handler existente): disparar email de confirmação de pagamento
  - [ ] 3.5 Garantir que falha no envio de email NÃO bloqueia o processamento do webhook (try/catch separado)
  - [ ] 3.6 Escrever testes para: cada evento Stripe dispara o email correto, falha de email não afeta processamento

- [ ] Task 4: Validação e conformidade RGPD (AC: #5)
  - [ ] 4.1 Confirmar que todos os templates incluem link de preferências de email (ex: `${NEXT_PUBLIC_APP_URL}/settings?tab=notifications`)
  - [ ] 4.2 Confirmar que remetente é consistente: "ultra-ia <noreply@ultra-ia.com>"
  - [ ] 4.3 Confirmar que todos os textos estão em francês

- [ ] Task 5: Testes e verificação final
  - [ ] 5.1 Testar manualmente todos os 4 tipos de email no ambiente de desenvolvimento
  - [ ] 5.2 Escrever testes unitários para os schemas Zod de validação de variáveis
  - [ ] 5.3 Rodar `npm run type-check` e `npm run lint` sem erros

## Dev Notes

### Dependência Crítica: Story 6.1 DEVE estar implementada

Esta story depende **inteiramente** da Story 6.1 (`6-1-infraestrutura-de-email-transacional`). O dev agent DEVE verificar se `src/lib/email.ts` existe e exporta a função `sendEmail()` antes de começar.

Se Story 6.1 não estiver implementada:
```
❌ PARAR - Executar Story 6.1 primeiro
```

A função esperada da Story 6.1:
```typescript
// src/lib/email.ts (criada pela Story 6.1)
export async function sendEmail(params: {
  to: string
  template: EmailTemplate
  variables: Record<string, unknown>
}): Promise<{ success: boolean; error?: string }>
```

### Ponto de Integração 1: Registro de Usuário (Story 2.1)

**Arquivo alvo**: `src/actions/auth-actions.ts`
**Função alvo**: `register` (ou nome equivalente para criação de conta)

Padrão de integração:
```typescript
'use server'
import { sendEmail } from '@/lib/email'
import Sentry from '@/lib/sentry'

export async function register(input: unknown) {
  // ... validação e criação de usuário existente (Story 2.1) ...

  // Após usuário criado com sucesso:
  try {
    await sendEmail({
      to: newUser.email,
      template: 'welcome',
      variables: {
        userName: newUser.name ?? newUser.email,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
      },
    })
  } catch (emailError) {
    // CRÍTICO: Falha no email NÃO deve falhar o registro
    Sentry.captureException(emailError, {
      tags: { context: 'welcome-email', userId: newUser.id },
    })
    // Continuar - usuário já foi criado
  }

  return { success: true, data: newUser }
}
```

### Ponto de Integração 2: Webhooks Stripe (Story 3.2)

**Arquivo alvo**: `src/app/api/webhooks/stripe/route.ts`

O arquivo de webhooks deve ter uma estrutura com switch/case por event.type. Adicionar os disparos de email dentro de cada case:

```typescript
// POST /api/webhooks/stripe
import { sendEmail } from '@/lib/email'

// Case: checkout.session.completed
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session
  // ... lógica existente de atualizar subscription no Prisma ...

  // Buscar dados para o email
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const specialist = await prisma.specialist.findUnique({ where: { id: specialistId } })

  try {
    await sendEmail({
      to: user.email,
      template: 'subscription-confirmed',
      variables: {
        userName: user.name ?? user.email,
        specialistName: specialist.name,
        amount: formatAmount(session.amount_total, session.currency),
        nextBillingDate: formatDate(subscription.currentPeriodEnd),
        chatUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
      },
    })
  } catch (emailError) {
    Sentry.captureException(emailError, {
      tags: { context: 'subscription-confirmed-email', userId },
    })
    // Continuar - webhook processado com sucesso mesmo sem email
  }
  break
}

// Case: invoice.payment_failed
case 'invoice.payment_failed': {
  // ... lógica existente ...
  try {
    await sendEmail({
      to: user.email,
      template: 'payment-failed',
      variables: {
        userName: user.name ?? user.email,
        amount: formatAmount(invoice.amount_due, invoice.currency),
        gracePeriodEnd: formatDate(gracePeriodEnd),
        billingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      },
    })
  } catch (emailError) {
    Sentry.captureException(emailError, { tags: { context: 'payment-failed-email' } })
  }
  break
}

// Case: invoice.payment_succeeded (adicionar se não existir)
case 'invoice.payment_succeeded': {
  // Verificar se é uma renovação após falha (não a primeira cobrança)
  if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_update') {
    try {
      await sendEmail({
        to: user.email,
        template: 'payment-succeeded',
        variables: {
          userName: user.name ?? user.email,
          amount: formatAmount(invoice.amount_paid, invoice.currency),
          nextBillingDate: formatDate(subscription.currentPeriodEnd),
          chatUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
        },
      })
    } catch (emailError) {
      Sentry.captureException(emailError, { tags: { context: 'payment-succeeded-email' } })
    }
  }
  break
}
```

### Estrutura dos Templates de Email

Criar na pasta `src/lib/email-templates/`:

```typescript
// src/lib/email-templates/welcome.ts
import { z } from 'zod'

export const welcomeVariablesSchema = z.object({
  userName: z.string().min(1),
  dashboardUrl: z.string().url(),
})

export type WelcomeVariables = z.infer<typeof welcomeVariablesSchema>

export function getWelcomeTemplate(variables: WelcomeVariables): { subject: string; html: string } {
  return {
    subject: 'Bienvenue sur ultra-ia ! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <header style="background: #18181b; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">ultra-ia</h1>
          </header>
          <main style="padding: 32px 24px;">
            <h2>Bienvenue, ${variables.userName} !</h2>
            <p>Votre compte ultra-ia est prêt. Vous pouvez maintenant accéder à vos spécialistes IA.</p>
            <p><strong>Prochaines étapes :</strong></p>
            <ol>
              <li>Choisissez votre spécialiste IA</li>
              <li>Démarrez votre première conversation</li>
              <li>Obtenez des réponses expertes instantanément</li>
            </ol>
            <a href="${variables.dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:16px;">
              Accéder au dashboard
            </a>
          </main>
          <footer style="padding: 24px; text-align: center; color: #71717a; font-size: 12px; border-top: 1px solid #e4e4e7;">
            <p>ultra-ia — Vos spécialistes IA à portée de main</p>
            <p><a href="${variables.dashboardUrl}/settings?tab=notifications" style="color: #71717a;">Gérer mes préférences email</a></p>
          </footer>
        </body>
      </html>
    `,
  }
}
```

Padrão idêntico para os outros 3 templates. O footer com link de preferências é **obrigatório** em todos.

### Schemas Zod de Validação

```typescript
// src/lib/validations/email.ts
import { z } from 'zod'

export const welcomeVariablesSchema = z.object({
  userName: z.string().min(1),
  dashboardUrl: z.string().url(),
})

export const subscriptionConfirmedVariablesSchema = z.object({
  userName: z.string().min(1),
  specialistName: z.string().min(1),
  amount: z.string().min(1),        // ex: "29,99 €"
  nextBillingDate: z.string().min(1), // ex: "10 avril 2026"
  chatUrl: z.string().url(),
})

export const paymentFailedVariablesSchema = z.object({
  userName: z.string().min(1),
  amount: z.string().min(1),
  gracePeriodEnd: z.string().min(1),
  billingUrl: z.string().url(),
})

export const paymentSucceededVariablesSchema = z.object({
  userName: z.string().min(1),
  amount: z.string().min(1),
  nextBillingDate: z.string().min(1),
  chatUrl: z.string().url(),
})
```

### Formatação de Valores (Francês)

```typescript
// Usar date-fns com locale francês (já definido na architecture)
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

function formatDate(date: Date | string): string {
  return format(new Date(date), 'd MMMM yyyy', { locale: fr })
  // Saída: "10 avril 2026"
}

function formatAmount(amountInCents: number | null, currency: string): string {
  if (!amountInCents) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100)
  // Saída: "29,99 €"
}
```

### Regras Críticas de Implementação

1. **NUNCA** bloquear o fluxo principal por falha de email — sempre usar try/catch isolado
2. **SEMPRE** logar falhas de email no Sentry com contexto suficiente (userId, template)
3. **NUNCA** criar novos endpoints de API para disparar emails — usar server actions e handlers existentes
4. **NUNCA** usar cron jobs — emails disparados em tempo real por eventos
5. **SEMPRE** validar variáveis do template com Zod antes de passar para `sendEmail()`
6. **VERIFICAR** se Story 6.1 está implementada antes de iniciar qualquer código

### Estrutura de Arquivos a Criar/Modificar

**Novos arquivos (criar):**
```
src/lib/email-templates/
├── welcome.ts                    # Template boas-vindas
├── subscription-confirmed.ts     # Template confirmação assinatura
├── payment-failed.ts             # Template falha pagamento
└── payment-succeeded.ts          # Template pagamento recuperado
src/lib/validations/email.ts      # Zod schemas das variáveis
src/types/email.ts                # Tipos TypeScript de email
```

**Arquivos existentes (modificar):**
```
src/actions/auth-actions.ts       # Adicionar envio de welcome email
src/app/api/webhooks/stripe/route.ts  # Adicionar envios em cada event handler
```

**Arquivos de teste (criar ao lado do arquivo testado):**
```
src/lib/validations/email.test.ts
src/actions/auth-actions.test.ts  # (pode já existir de Story 2.1 — adicionar casos)
```

### Variáveis de Ambiente Necessárias

Da Story 6.1 (já devem estar no `.env.local`):
```bash
EMAIL_SERVICE_API_KEY="..."
EMAIL_FROM_ADDRESS="noreply@ultra-ia.com"
```

App URL (já deve existir):
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Project Structure Notes

- Alinhamento total com estrutura da architecture: lib em `src/lib/`, validações em `src/lib/validations/`, tipos em `src/types/`
- Nenhuma nova rota de API — integração via server actions e handlers existentes
- Pasta `src/lib/email-templates/` não está na architecture (não estava prevista), mas segue o padrão de organização por feature/função dentro de `src/lib/`
- Testes co-localizados ao lado dos arquivos testados (padrão obrigatório da architecture)

### Conformidade RGPD

- Todos os templates DEVEM ter footer com link: `${NEXT_PUBLIC_APP_URL}/settings?tab=notifications`
- Link deve ser renderizado como texto visível ("Gérer mes préférences email")
- A página `/settings` deve ter aba `notifications` — se não existir na Story 2.4, criar uma seção simples

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.2] — Acceptance Criteria FR39-FR42
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Server Action Pattern, Error Handling, Naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Estrutura de arquivos e boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — NFR11 RGPD compliance
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.1] — Dependência da função `sendEmail()`
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.2] — Webhook handlers Stripe existentes

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
