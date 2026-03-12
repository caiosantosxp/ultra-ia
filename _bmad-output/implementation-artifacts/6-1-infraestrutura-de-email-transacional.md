# Story 6.1: Infraestrutura de Email Transacional

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **to have a reliable email sending infrastructure**,
so that **all transactional emails are delivered consistently and professionally**.

## Acceptance Criteria

1. **Given** o sistema precisa enviar um email transacional **When** a função `sendEmail()` de `src/lib/email.ts` é chamada com tipo, destinatário e variáveis **Then** o email é enviado via Resend com template HTML responsivo
2. **And** todos os emails usam domínio verificado com remetente consistente: `"ultra-ia <noreply@ultra-ia.com>"`
3. **Given** o envio de um email falha **When** o Resend retorna erro **Then** o sistema faz retry automático (até 3 tentativas com backoff exponencial: 1s, 4s, 16s)
4. **And** o erro é logado para monitoramento (console em dev, Sentry em produção — NFR20)
5. **Given** qualquer email é enviado **When** o destinatário recebe **Then** o email contém header com logo ultra-ia, footer com link de gestão de preferências conforme RGPD (NFR11)
6. **And** o conteúdo é em francês, consistente com a interface da plataforma
7. **And** `sendEmail()` exporta uma função genérica reutilizável: `sendEmail({ to, template, variables })`
8. **And** templates são definidos como constantes tipadas com Zod validation nas variáveis
9. **And** o email layout base é responsivo (max-width 480px, font-family Inter/sans-serif, cores do design system)
10. **And** variáveis de ambiente `RESEND_API_KEY` e `EMAIL_FROM` adicionadas ao `.env.example`

## Tasks / Subtasks

- [ ] Task 1: Instalar Resend SDK (AC: #1)
  - [ ] 1.1 Instalar pacote: `npm install resend`
  - [ ] 1.2 Verificar versão instalada é `^6.9.3` (latest stable março 2026)

- [ ] Task 2: Configurar variáveis de ambiente (AC: #2, #10)
  - [ ] 2.1 Adicionar ao `.env.example`:
    ```bash
    # Email (Resend)
    RESEND_API_KEY="re_..."
    EMAIL_FROM="ultra-ia <noreply@ultra-ia.com>"
    ```
  - [ ] 2.2 Adicionar ao `.env.local` (desenvolvimento):
    ```bash
    RESEND_API_KEY="re_test_..."
    EMAIL_FROM="ultra-ia <onboarding@resend.dev>"
    ```
    > Nota: Em dev, usar `onboarding@resend.dev` (domínio sandbox do Resend free tier)

- [ ] Task 3: Criar schemas Zod para templates de email (AC: #8)
  - [ ] 3.1 Criar `src/lib/validations/email.ts`:
    ```typescript
    import { z } from 'zod'

    // Schema base para todas as variáveis de email
    export const baseEmailVariablesSchema = z.object({
      userName: z.string().min(1),
    })

    // Welcome email (FR39)
    export const welcomeEmailSchema = baseEmailVariablesSchema.extend({
      dashboardUrl: z.string().url(),
    })

    // Subscription confirmation (FR40)
    export const subscriptionConfirmationSchema = baseEmailVariablesSchema.extend({
      specialistName: z.string().min(1),
      amount: z.string().min(1),
      nextBillingDate: z.string().min(1),
      chatUrl: z.string().url(),
    })

    // Payment failed (FR41)
    export const paymentFailedSchema = baseEmailVariablesSchema.extend({
      specialistName: z.string().min(1),
      gracePeriodEnd: z.string().min(1),
      billingUrl: z.string().url(),
    })

    // Payment updated (FR42)
    export const paymentUpdatedSchema = baseEmailVariablesSchema.extend({
      specialistName: z.string().min(1),
      amount: z.string().min(1),
      nextBillingDate: z.string().min(1),
      chatUrl: z.string().url(),
    })

    // Password reset (FR6) — usado pela Story 2.3
    export const passwordResetSchema = baseEmailVariablesSchema.extend({
      resetUrl: z.string().url(),
    })

    // Union type de todos os templates
    export const EMAIL_TEMPLATES = {
      WELCOME: 'welcome',
      SUBSCRIPTION_CONFIRMATION: 'subscription-confirmation',
      PAYMENT_FAILED: 'payment-failed',
      PAYMENT_UPDATED: 'payment-updated',
      PASSWORD_RESET: 'password-reset',
    } as const

    export type EmailTemplate = typeof EMAIL_TEMPLATES[keyof typeof EMAIL_TEMPLATES]

    // Mapa template → schema para validação dinâmica
    export const emailSchemaMap: Record<EmailTemplate, z.ZodSchema> = {
      [EMAIL_TEMPLATES.WELCOME]: welcomeEmailSchema,
      [EMAIL_TEMPLATES.SUBSCRIPTION_CONFIRMATION]: subscriptionConfirmationSchema,
      [EMAIL_TEMPLATES.PAYMENT_FAILED]: paymentFailedSchema,
      [EMAIL_TEMPLATES.PAYMENT_UPDATED]: paymentUpdatedSchema,
      [EMAIL_TEMPLATES.PASSWORD_RESET]: passwordResetSchema,
    }
    ```

- [ ] Task 4: Criar templates HTML de email (AC: #5, #6, #9)
  - [ ] 4.1 Criar `src/lib/email-templates.ts` — funções que geram HTML inline para cada template:
    ```typescript
    // Layout base responsivo — inline CSS obrigatório para emails
    const EMAIL_STYLES = {
      container: 'font-family: Inter, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FFFFFF;',
      header: 'text-align: center; padding-bottom: 24px; border-bottom: 1px solid #E5E7EB;',
      logo: 'font-size: 20px; font-weight: 700; color: #0F172A;',
      heading: 'font-size: 24px; font-weight: 700; color: #0F172A; margin: 24px 0 8px;',
      body: 'color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 16px;',
      button: 'display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;',
      footer: 'border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 16px; color: #94A3B8; font-size: 12px; text-align: center;',
      muted: 'color: #94A3B8; font-size: 14px; margin-top: 24px;',
    } as const

    function wrapLayout(content: string, preferencesUrl: string): string {
      return `
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin: 0; padding: 0; background: #F8FAFC;">
          <div style="${EMAIL_STYLES.container}">
            <div style="${EMAIL_STYLES.header}">
              <span style="${EMAIL_STYLES.logo}">ultra-ia</span>
            </div>
            ${content}
            <div style="${EMAIL_STYLES.footer}">
              <p>ultra-ia — Votre expert IA spécialisé</p>
              <p><a href="${preferencesUrl}" style="color: #94A3B8;">Gérer mes préférences</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Cada função de template retorna { subject, html }
    export function welcomeTemplate(vars: { userName: string; dashboardUrl: string }) {
      const content = `
        <h1 style="${EMAIL_STYLES.heading}">Bienvenue sur ultra-ia !</h1>
        <p style="${EMAIL_STYLES.body}">
          Bonjour ${vars.userName},<br><br>
          Votre compte a été créé avec succès. Vous pouvez dès maintenant découvrir
          nos experts IA spécialisés et commencer vos premières consultations.
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${vars.dashboardUrl}" style="${EMAIL_STYLES.button}">Accéder au tableau de bord</a>
        </p>
        <p style="${EMAIL_STYLES.muted}">
          Si vous n'avez pas créé ce compte, veuillez ignorer cet email.
        </p>
      `
      return {
        subject: 'Bienvenue sur ultra-ia !',
        html: wrapLayout(content, `${vars.dashboardUrl}/settings`),
      }
    }

    export function subscriptionConfirmationTemplate(vars: {
      userName: string; specialistName: string; amount: string; nextBillingDate: string; chatUrl: string
    }) {
      const content = `
        <h1 style="${EMAIL_STYLES.heading}">Abonnement confirmé</h1>
        <p style="${EMAIL_STYLES.body}">
          Bonjour ${vars.userName},<br><br>
          Votre abonnement à <strong>${vars.specialistName}</strong> est maintenant actif.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #6B7280;">Spécialiste</td><td style="padding: 8px 0; font-weight: 600;">${vars.specialistName}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Montant mensuel</td><td style="padding: 8px 0; font-weight: 600;">${vars.amount}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Prochaine facturation</td><td style="padding: 8px 0; font-weight: 600;">${vars.nextBillingDate}</td></tr>
        </table>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${vars.chatUrl}" style="${EMAIL_STYLES.button}">Démarrer une conversation</a>
        </p>
      `
      return {
        subject: `Abonnement confirmé — ${vars.specialistName}`,
        html: wrapLayout(content, `${vars.chatUrl.split('/chat')[0]}/settings`),
      }
    }

    export function paymentFailedTemplate(vars: {
      userName: string; specialistName: string; gracePeriodEnd: string; billingUrl: string
    }) {
      const content = `
        <h1 style="${EMAIL_STYLES.heading}">Problème de paiement</h1>
        <p style="${EMAIL_STYLES.body}">
          Bonjour ${vars.userName},<br><br>
          Le renouvellement de votre abonnement à <strong>${vars.specialistName}</strong> a échoué.
          Votre accès reste actif jusqu'au <strong>${vars.gracePeriodEnd}</strong>.
        </p>
        <p style="${EMAIL_STYLES.body}">
          Veuillez mettre à jour votre méthode de paiement pour continuer à utiliser le service.
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${vars.billingUrl}" style="${EMAIL_STYLES.button}">Mettre à jour le paiement</a>
        </p>
        <p style="${EMAIL_STYLES.muted}">
          Si vous ne mettez pas à jour avant le ${vars.gracePeriodEnd}, votre accès au chat sera suspendu.
        </p>
      `
      return {
        subject: 'Action requise — Problème de paiement',
        html: wrapLayout(content, `${vars.billingUrl.split('/billing')[0]}/settings`),
      }
    }

    export function paymentUpdatedTemplate(vars: {
      userName: string; specialistName: string; amount: string; nextBillingDate: string; chatUrl: string
    }) {
      const content = `
        <h1 style="${EMAIL_STYLES.heading}">Paiement confirmé</h1>
        <p style="${EMAIL_STYLES.body}">
          Bonjour ${vars.userName},<br><br>
          Votre paiement pour <strong>${vars.specialistName}</strong> a été traité avec succès.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px 0; color: #6B7280;">Montant</td><td style="padding: 8px 0; font-weight: 600;">${vars.amount}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Prochaine facturation</td><td style="padding: 8px 0; font-weight: 600;">${vars.nextBillingDate}</td></tr>
        </table>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${vars.chatUrl}" style="${EMAIL_STYLES.button}">Reprendre la conversation</a>
        </p>
      `
      return {
        subject: 'Paiement confirmé — Accès rétabli',
        html: wrapLayout(content, `${vars.chatUrl.split('/chat')[0]}/settings`),
      }
    }

    export function passwordResetTemplate(vars: { userName: string; resetUrl: string }) {
      const content = `
        <h1 style="${EMAIL_STYLES.heading}">Réinitialisation du mot de passe</h1>
        <p style="${EMAIL_STYLES.body}">
          Bonjour ${vars.userName},<br><br>
          Vous avez demandé la réinitialisation de votre mot de passe ultra-ia.
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
          Ce lien expire dans <strong>1 heure</strong>.
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${vars.resetUrl}" style="${EMAIL_STYLES.button}">Réinitialiser le mot de passe</a>
        </p>
        <p style="${EMAIL_STYLES.muted}">
          Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      `
      return {
        subject: 'Réinitialisation de votre mot de passe',
        html: wrapLayout(content, `${vars.resetUrl.split('/reset')[0]}/settings`),
      }
    }

    // Mapa template → função geradora
    export const templateFunctions: Record<string, (vars: Record<string, string>) => { subject: string; html: string }> = {
      'welcome': welcomeTemplate,
      'subscription-confirmation': subscriptionConfirmationTemplate,
      'payment-failed': paymentFailedTemplate,
      'payment-updated': paymentUpdatedTemplate,
      'password-reset': passwordResetTemplate,
    }
    ```

- [ ] Task 5: Criar serviço de email com retry (AC: #1, #3, #4, #7)
  - [ ] 5.1 Criar `src/lib/email.ts`:
    ```typescript
    import { Resend } from 'resend'
    import { emailSchemaMap, type EmailTemplate } from '@/lib/validations/email'
    import { templateFunctions } from '@/lib/email-templates'

    const resend = new Resend(process.env.RESEND_API_KEY)

    const MAX_RETRIES = 3
    const BASE_DELAY_MS = 1000 // 1s, 4s, 16s (exponential)

    interface SendEmailInput {
      to: string
      template: EmailTemplate
      variables: Record<string, string>
    }

    interface SendEmailResult {
      success: boolean
      data?: { id: string }
      error?: { code: string; message: string }
    }

    async function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }

    export async function sendEmail({ to, template, variables }: SendEmailInput): Promise<SendEmailResult> {
      // 1. Validar variáveis com Zod schema
      const schema = emailSchemaMap[template]
      if (!schema) {
        return { success: false, error: { code: 'INVALID_TEMPLATE', message: `Unknown template: ${template}` } }
      }

      const parsed = schema.safeParse(variables)
      if (!parsed.success) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message },
        }
      }

      // 2. Gerar conteúdo do email
      const templateFn = templateFunctions[template]
      if (!templateFn) {
        return { success: false, error: { code: 'TEMPLATE_NOT_FOUND', message: `No template function for: ${template}` } }
      }
      const { subject, html } = templateFn(variables)

      // 3. Enviar com retry (backoff exponencial)
      let lastError: Error | null = null

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM ?? 'ultra-ia <noreply@ultra-ia.com>',
            to,
            subject,
            html,
          })

          if (error) {
            lastError = new Error(error.message)
            if (attempt < MAX_RETRIES - 1) {
              const delay = BASE_DELAY_MS * Math.pow(4, attempt)
              await sleep(delay)
              continue
            }
          }

          if (data) {
            return { success: true, data: { id: data.id } }
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          if (attempt < MAX_RETRIES - 1) {
            const delay = BASE_DELAY_MS * Math.pow(4, attempt)
            await sleep(delay)
            continue
          }
        }
      }

      // Logar erro final
      console.error(`[email] Failed to send "${template}" to ${to} after ${MAX_RETRIES} attempts:`, lastError)

      return {
        success: false,
        error: { code: 'EMAIL_SEND_FAILED', message: lastError?.message ?? 'Unknown error after retries' },
      }
    }
    ```

- [ ] Task 6: Adicionar error codes para email (AC: #4)
  - [ ] 6.1 Os seguintes error codes são usados pelo serviço de email (compatíveis com padrão existente):
    - `INVALID_TEMPLATE` — template desconhecido
    - `VALIDATION_ERROR` — variáveis do template inválidas (Zod)
    - `TEMPLATE_NOT_FOUND` — função de template não registrada
    - `EMAIL_SEND_FAILED` — falha após 3 tentativas
  - [ ] 6.2 Retorno segue o padrão `{ success, data?, error? }` do projeto

- [ ] Task 7: Testes manuais de validação (AC: todos)
  - [ ] 7.1 Verificar que `sendEmail()` compila sem erros TypeScript
  - [ ] 7.2 Verificar que todos os schemas Zod validam corretamente (campos obrigatórios, URLs válidas)
  - [ ] 7.3 Verificar que cada template gera HTML válido com header, footer e link de preferências
  - [ ] 7.4 Verificar que o retry logic respeita backoff exponencial (1s, 4s, 16s)
  - [ ] 7.5 Verificar que o EMAIL_FROM fallback funciona quando variável não definida
  - [ ] 7.6 Verificar que emails são renderizados em francês
  - [ ] 7.7 Verificar que o layout é responsivo (max-width 480px)

## Dev Notes

### Arquitetura de Email

**Decisão arquitetural:** Resend (Vercel-native) — integração mais simples com Next.js, free tier suficiente para MVP (3.000 emails/mês).

**Padrão de uso:** `sendEmail()` é uma função server-side pura. Será chamada por:
- Server Actions (Story 2.1: welcome email após registro)
- Server Actions (Story 2.3: password reset)
- Webhook handlers (Story 3.2: confirmação de assinatura, falha de pagamento)
- NÃO usar em client components — sempre server-side

**Retry strategy:** Backoff exponencial com base 4: tentativa 1 (0s), tentativa 2 (+1s), tentativa 3 (+4s). Após 3 falhas, erro logado e retorno `{ success: false }`. O caller decide se propaga o erro ao usuário ou falha silenciosamente.

**Templates:** HTML inline com CSS inline (obrigatório para compatibilidade email). NÃO usar React Email / @react-email nesta story — HTML strings são suficientes para 5 templates. Se no futuro precisar de templates mais complexos, migrar para React Email.

### Anti-Patterns a Evitar

- **NÃO criar API route** para envio de email — usar `sendEmail()` diretamente em Server Actions/webhook handlers
- **NÃO usar `react-email`** nesta story — HTML inline suficiente, Story 2.3 já definiu isso
- **NÃO criar modelo Prisma** para fila de emails — retry in-process é suficiente para MVP (NFR20 satisfeito com retry automático)
- **NÃO hardcodar textos** — usar variáveis nos templates, mas manter subject fixo por template
- **NÃO criar middleware** para email — função pura chamada por Server Actions
- **NÃO importar** Sentry nesta story — usar `console.error` com formato estruturado; Sentry será adicionado quando configurado

### Padrão Server Action (seguir rigorosamente)

```typescript
// Exemplo de uso do sendEmail() em uma Server Action (Story 2.1 ou 6.2)
'use server'
import { sendEmail } from '@/lib/email'
import { EMAIL_TEMPLATES } from '@/lib/validations/email'

export async function registerUser(input: unknown) {
  // 1. Auth check (se aplicável)
  // 2. Zod validation do input
  // 3. Business logic (criar user no Prisma)
  // 4. Enviar email (fire-and-forget ou await conforme caso)
  const emailResult = await sendEmail({
    to: user.email,
    template: EMAIL_TEMPLATES.WELCOME,
    variables: {
      userName: user.name ?? 'Utilisateur',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
    },
  })
  // 5. Email failure NÃO deve bloquear o registro — logar e continuar
  if (!emailResult.success) {
    console.error('[register] Welcome email failed:', emailResult.error)
  }
  return { success: true, data: user }
}
```

### Ambiente de Desenvolvimento

- **Resend free tier:** 3.000 emails/mês, domínio sandbox `onboarding@resend.dev`
- **Para testar sem conta Resend:** A variável `RESEND_API_KEY` pode ficar vazia; o SDK lançará erro que será capturado pelo retry e logado
- **Domínio verificado em produção:** Configurar DNS (SPF, DKIM) no painel do Resend antes do deploy

### Project Structure Notes

**Arquivos novos (3):**
```
src/lib/email.ts                    # Serviço principal sendEmail()
src/lib/email-templates.ts          # Templates HTML inline
src/lib/validations/email.ts        # Schemas Zod para variáveis
```

**Arquivos modificados (1):**
```
.env.example                        # + RESEND_API_KEY, EMAIL_FROM
```

**Localização justificada:**
- `src/lib/email.ts` — serviço de infraestrutura, ao lado de `prisma.ts`, `stripe.ts`, `auth.ts`
- `src/lib/email-templates.ts` — templates são parte da lib, não componentes React
- `src/lib/validations/email.ts` — pasta validations já planejada para schemas Zod

### Convenções de Naming (obrigatório)

| Elemento | Convenção | Exemplo |
|---|---|---|
| Arquivo de serviço | kebab-case | `email.ts` |
| Arquivo de templates | kebab-case | `email-templates.ts` |
| Arquivo de schema | kebab-case | `email.ts` (dentro de validations/) |
| Constantes de template | UPPER_SNAKE_CASE | `EMAIL_TEMPLATES.WELCOME` |
| Funções de template | camelCase com sufixo Template | `welcomeTemplate()` |
| Tipos | PascalCase | `EmailTemplate`, `SendEmailInput` |
| Error codes | UPPER_SNAKE_CASE | `EMAIL_SEND_FAILED` |

### Dependências

| Pacote | Versão | Propósito |
|---|---|---|
| `resend` | `^6.9.3` | SDK oficial Resend para Node.js |
| `zod` | `3.24` | Validação de variáveis (já instalado) |

### Escopo IN/OUT

**IN scope (Story 6.1):**
- Instalar Resend SDK
- Criar `sendEmail()` genérica com retry
- Criar 5 templates HTML (welcome, subscription confirmation, payment failed, payment updated, password reset)
- Schemas Zod para validação de variáveis de cada template
- Variáveis de ambiente no `.env.example`
- Layout base responsivo com header/footer/RGPD

**OUT of scope (outras stories):**
- Envio real de emails em hooks/actions — Story 6.2 (conta/pagamento), Story 2.1 (welcome), Story 2.3 (reset)
- Integração com webhooks Stripe — Story 3.2
- React Email / componentes React — não necessário para MVP
- Modelo Prisma de fila de emails — desnecessário para MVP
- Email marketing / newsletters — fora do MVP
- Push notifications — fora do MVP

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6 — Stories 6.1 e 6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integrações — Resend como email service]
- [Source: _bmad-output/planning-artifacts/prd.md#FR39-FR42 — Requisitos de email transacional]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR20 — Retry queue para emails]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System — Cores e tipografia]
- [Source: _bmad-output/implementation-artifacts/2-3-reset-de-senha.md — Setup inicial Resend como referência]
- [Web: Resend SDK v6.9.3 — https://www.npmjs.com/package/resend]
- [Web: Resend + Next.js App Router — https://resend.com/docs/send-with-nextjs]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
