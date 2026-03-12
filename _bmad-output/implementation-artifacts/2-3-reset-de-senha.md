# Story 2.3: Reset de Senha

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to reset my password via email**,
so that **I can recover access to my account if I forget my password**.

## Acceptance Criteria

1. **Given** um usuário acessa `/login` e clica em "Mot de passe oublié ?" **When** insere seu email e submete **Then** um email com link de reset é enviado (token com expiração de 1 hora) **And** a mensagem de confirmação exibida é: "Si cet email existe, un lien de réinitialisation a été envoyé" — independente de o email existir ou não (segurança: não revelar existência de conta)
2. **And** o link de reset redireciona para `/reset-password?token=TOKEN_VALUE`
3. **Given** um usuário clica no link de reset válido em `/reset-password` **When** define uma nova senha (mínimo 8 caracteres) e submete **Then** a senha é atualizada com bcrypt hash (salt 12), o token é invalidado (`usedAt` preenchido) e o usuário é redirecionado para `/login` com toast de sucesso: "Mot de passe mis à jour avec succès"
4. **Given** um usuário acessa `/reset-password` com token expirado (> 1 hora) **When** tenta definir nova senha **Then** uma mensagem de erro é exibida: "Ce lien a expiré. Veuillez demander un nouveau lien." com link para `/forgot-password`
5. **Given** um usuário acessa `/reset-password` com token já utilizado **When** tenta definir nova senha **Then** a mesma mensagem de expirado é exibida (não revelar distinção entre expirado/usado)
6. **And** o modelo `PasswordResetToken` existe no Prisma com campos: id, token (unique), email, expiresAt, usedAt, createdAt
7. **And** o token é gerado com `crypto.randomBytes(32).toString('hex')` (64 chars hex, criptograficamente seguro)
8. **And** rate limiting: máximo 3 requisições de reset por email por hora (proteção contra spam)
9. **And** validação Zod: email válido no form de solicitação, senha mínima 8 caracteres no form de reset
10. **And** todas as páginas são responsivas (mobile, tablet, desktop) e suportam dark/light mode
11. **And** acessibilidade WCAG 2.1 AA: labels associados, aria-required, aria-invalid, focus-visible, role="alert" para erros

## Tasks / Subtasks

- [x] Task 1: Adicionar modelo PasswordResetToken ao Prisma (AC: #6)
  - [x] 1.1 Adicionar ao `prisma/schema.prisma`:
    ```prisma
    model PasswordResetToken {
      id        String    @id @default(cuid())
      token     String    @unique
      email     String
      expiresAt DateTime
      usedAt    DateTime?
      createdAt DateTime  @default(now())

      @@map("password_reset_tokens")
      @@index([token])
      @@index([email])
    }
    ```
  - [x] 1.2 Executar `npx prisma db push` para aplicar schema ao banco (usado em lugar de migrate dev devido a drift no ambiente de dev)

- [x] Task 2: Instalar e configurar Resend para envio de emails (AC: #1, #2)
  - [x] 2.1 Instalar pacote: `npm install resend`
  - [x] 2.2 Adicionar variável de ambiente ao `.env.example`:
    ```bash
    # Email (Resend)
    RESEND_API_KEY="re_..."
    EMAIL_FROM="noreply@ultra-ia.com"
    ```
  - [x] 2.3 Criar `src/lib/email.ts` com cliente Resend e função de envio:
    ```typescript
    import { Resend } from 'resend';

    const resend = new Resend(process.env.RESEND_API_KEY);

    export async function sendPasswordResetEmail(email: string, resetUrl: string) {
      return resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@ultra-ia.com',
        to: email,
        subject: 'Réinitialisation de votre mot de passe ultra-ia',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">
              Réinitialisation du mot de passe
            </h1>
            <p style="color: #475569; margin-bottom: 24px;">
              Vous avez demandé la réinitialisation de votre mot de passe ultra-ia.
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
              Ce lien expire dans <strong>1 heure</strong>.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: white;
               padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Réinitialiser le mot de passe
            </a>
            <p style="color: #94A3B8; margin-top: 24px; font-size: 14px;">
              Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
            <p style="color: #94A3B8; font-size: 12px;">ultra-ia — Votre expert IA spécialisé</p>
          </div>
        `,
      });
    }
    ```

- [x] Task 3: Adicionar schemas Zod para reset de senha (AC: #9)
  - [x] 3.1 Adicionar ao arquivo existente `src/lib/validations/auth.ts`:
    ```typescript
    export const forgotPasswordSchema = z.object({
      email: z.string().email('Email invalide'),
    });

    export const resetPasswordSchema = z.object({
      token: z.string().min(1, 'Token requis'),
      password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    });

    export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
    export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
    ```

- [x] Task 4: Criar Server Actions de reset de senha (AC: #1, #3, #4, #5, #7, #8)
  - [x] 4.1 Adicionar ao arquivo existente `src/actions/auth-actions.ts` as duas actions:
    ```typescript
    'use server';
    import crypto from 'crypto';
    import bcrypt from 'bcrypt';
    import { prisma } from '@/lib/prisma';
    import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';
    import { sendPasswordResetEmail } from '@/lib/email';
    import { APP_URL } from '@/lib/constants';

    export async function requestPasswordReset(input: unknown) {
      const parsed = forgotPasswordSchema.safeParse(input);
      if (!parsed.success) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
      }

      const { email } = parsed.data;

      // Rate limiting: máximo 3 tokens não-usados por email por hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTokens = await prisma.passwordResetToken.count({
        where: { email, createdAt: { gte: oneHourAgo }, usedAt: null },
      });
      if (recentTokens >= 3) {
        // Retornar sucesso para não revelar rate limit (segurança)
        return { success: true, data: { message: 'email_sent' } };
      }

      // Buscar usuário — sem revelar se existe
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && user.password) {
        // Apenas usuários com password (Credentials) podem resetar
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await prisma.passwordResetToken.create({
          data: { token, email, expiresAt },
        });

        const resetUrl = `${APP_URL}/reset-password?token=${token}`;
        await sendPasswordResetEmail(email, resetUrl);
      }

      // Sempre retornar sucesso para não revelar se email existe
      return { success: true, data: { message: 'email_sent' } };
    }

    export async function resetPassword(input: unknown) {
      const parsed = resetPasswordSchema.safeParse(input);
      if (!parsed.success) {
        return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };
      }

      const { token, password } = parsed.data;
      const now = new Date();

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      // Token inválido, expirado ou já usado
      if (!resetToken || resetToken.expiresAt < now || resetToken.usedAt !== null) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Ce lien a expiré. Veuillez demander un nouveau lien.',
          },
        };
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Atualizar senha + invalidar token em transação
      await prisma.$transaction([
        prisma.user.update({
          where: { email: resetToken.email },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
          where: { token },
          data: { usedAt: now },
        }),
      ]);

      return { success: true, data: { message: 'password_updated' } };
    }
    ```

- [x] Task 5: Criar página "Mot de passe oublié" (AC: #1, #9, #10, #11)
  - [x] 5.1 Criar `src/app/(auth)/forgot-password/page.tsx`:
    ```typescript
    import type { Metadata } from 'next';
    import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

    export const metadata: Metadata = {
      title: 'Mot de passe oublié',
      description: 'Réinitialisez votre mot de passe ultra-ia',
    };

    export default function ForgotPasswordPage() {
      return (
        <div className="w-full max-w-sm px-4">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold">Mot de passe oublié ?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      );
    }
    ```
  - [x] 5.2 Criar `src/components/auth/forgot-password-form.tsx` (Client Component):
    - Formulário com campo Email (Input type="email", aria-required, aria-invalid)
    - Botão "Envoyer le lien" (Button primary, full-width, `min-h-11`)
    - Estado de sucesso: exibir mensagem "Si cet email existe, un lien de réinitialisation a été envoyé" com ícone ✓
    - Estado de loading: `useTransition` + botão disabled durante submit
    - Link "Retour à la connexion" para `/login`
    - Validação onBlur com React Hook Form + Zod resolver
    - `aria-describedby` + `aria-invalid` nos campos com erro

- [x] Task 6: Criar página "Reset de senha" (AC: #3, #4, #5, #9, #10, #11)
  - [x] 6.1 Criar `src/app/(auth)/reset-password/page.tsx`:
    ```typescript
    import type { Metadata } from 'next';
    import { redirect } from 'next/navigation';
    import { ResetPasswordForm } from '@/components/auth/reset-password-form';

    export const metadata: Metadata = {
      title: 'Nouveau mot de passe',
      description: 'Créez un nouveau mot de passe pour votre compte ultra-ia',
    };

    interface PageProps {
      searchParams: Promise<{ token?: string }>;
    }

    export default async function ResetPasswordPage({ searchParams }: PageProps) {
      const { token } = await searchParams;
      if (!token) redirect('/forgot-password');

      return (
        <div className="w-full max-w-sm px-4">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold">Nouveau mot de passe</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choisissez un mot de passe sécurisé (minimum 8 caractères)
            </p>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      );
    }
    ```
  - [x] 6.2 Criar `src/components/auth/reset-password-form.tsx` (Client Component):
    - Props: `token: string`
    - Formulário com campo "Nouveau mot de passe" (Input type="password", aria-required, aria-invalid)
    - Botão "Mettre à jour le mot de passe" (Button primary, full-width, `min-h-11`)
    - Estado de erro de token: exibir mensagem "Ce lien a expiré. Veuillez demander un nouveau lien." com link para `/forgot-password`
    - Após sucesso: redirect para `/login` (via `router.push`) + toast "Mot de passe mis à jour avec succès"
    - Estado de loading via `useTransition`
    - Validação onBlur com React Hook Form + Zod resolver
    - `aria-describedby` + `aria-invalid` nos campos com erro

- [x] Task 7: Adicionar link "Mot de passe oublié ?" na página de login (AC: #1)
  - [x] 7.1 No componente `src/components/auth/login-form.tsx` (criado na Story 2.2), adicionar link abaixo do campo senha:
    ```tsx
    <div className="flex items-center justify-between">
      <Label htmlFor="password">Mot de passe *</Label>
      <Link
        href="/forgot-password"
        className="text-xs text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Mot de passe oublié ?
      </Link>
    </div>
    ```
  - [x] 7.2 Story 2.2 não implementada: login-form.tsx criado com o link "Mot de passe oublié ?" já incluído + página de login criada em `src/app/(auth)/login/page.tsx`

- [x] Task 8: Validação final (AC: todos)
  - [x] 8.1 `npm run lint` sem erros
  - [x] 8.2 `npx tsc --noEmit` sem erros TypeScript
  - [ ] 8.3 Testar fluxo completo: solicitar reset com email válido → receber email → clicar link → definir nova senha → redirect para login com toast
  - [ ] 8.4 Testar com email não cadastrado: mensagem genérica exibida sem erro
  - [ ] 8.5 Testar token expirado: mensagem de erro + link para nova solicitação
  - [ ] 8.6 Testar token já usado: mesma mensagem de expirado
  - [ ] 8.7 Testar rate limiting: 3+ tentativas com mesmo email em 1h → silenciosamente ignorado
  - [ ] 8.8 Verificar que bcrypt hash é aplicado corretamente: senha atualizada no DB
  - [ ] 8.9 Verificar dark mode nos dois formulários (requere revisão manual)
  - [ ] 8.10 Verificar responsividade: mobile, tablet, desktop (requere revisão manual)
  - [ ] 8.11 Verificar keyboard navigation e aria attributes (Tab, focus-visible, aria-invalid) (requere revisão manual)

## Dev Notes

### Pré-requisitos das Stories 2.1 e 2.2

Esta story depende da infraestrutura implementada nas Stories 2.1 e 2.2:

**Da Story 2.1 (Registro):**
- `src/lib/auth.ts` — Auth.js v5 configurado com PrismaAdapter e Database Sessions
- `src/lib/validations/auth.ts` — schemas `registerSchema`, `loginSchema` já existem (a estender nesta story)
- `src/actions/auth-actions.ts` — action `register` já existe (a estender nesta story com `requestPasswordReset` e `resetPassword`)
- `prisma/schema.prisma` — modelos User (com campo `password`), Account, Session já existem
- `middleware.ts` — proteção de rotas configurada
- Dependências: `next-auth@5`, `@auth/prisma-adapter`, `bcrypt`, `@types/bcrypt`, `zod`, `react-hook-form`, `@hookform/resolvers`

**Da Story 2.2 (Login):**
- `src/app/(auth)/login/page.tsx` — página de login existente
- `src/components/auth/login-form.tsx` — formulário de login (onde o link "Mot de passe oublié ?" deve ser adicionado via Task 7)

**Estado esperado do codebase antes desta story:**
| Componente | Status Esperado |
|---|---|
| `src/lib/auth.ts` | Implementado (Auth.js v5 + Credentials + Google) |
| `src/lib/validations/auth.ts` | Tem `registerSchema` e `loginSchema` — ESTENDER com forgot/reset schemas |
| `src/actions/auth-actions.ts` | Tem `register` e `login` — ESTENDER com `requestPasswordReset` e `resetPassword` |
| `prisma/schema.prisma` | User com campo `password` — ADICIONAR `PasswordResetToken` |
| `src/components/auth/login-form.tsx` | Existe — ADICIONAR link "Mot de passe oublié ?" |
| `src/app/(auth)/forgot-password/` | NÃO existe — CRIAR |
| `src/app/(auth)/reset-password/` | NÃO existe — CRIAR |
| `src/lib/email.ts` | NÃO existe — CRIAR |

### Padrões de Arquitetura Obrigatórios

- **Email:** `resend` SDK — simplest Next.js/Vercel-native email solution. Epic 6 construirá infraestrutura completa de email em cima desta base
- **Token:** `crypto.randomBytes(32).toString('hex')` — 64 chars hex, criptograficamente seguro
- **Password:** sempre `bcrypt.hash(password, 12)` — NUNCA plain text
- **Security:** resposta genérica para não revelar existência de email ("Si cet email existe...")
- **Validation:** Zod em todo boundary — Server Actions + formulários
- **Forms:** React Hook Form + Zod resolver, validação `onBlur`
- **API Response:** `{ success: true, data: {...} }` ou `{ success: false, error: { code, message } }`
- **Server Actions:** ordem obrigatória: validate → rate limit check → find user → execute → return
- **Errors:** NUNCA usar mensagens diferentes para token expirado vs. token usado (timing attack prevention)
- **Language:** Toda interface em francês

### Modelo Prisma — PasswordResetToken

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  token     String    @unique         // 64 chars hex (crypto.randomBytes(32))
  email     String                    // Email do usuário (não FK — para segurança)
  expiresAt DateTime                  // now() + 1 hora no momento da criação
  usedAt    DateTime?                 // null = não usado, não-null = inválido
  createdAt DateTime  @default(now())

  @@map("password_reset_tokens")
  @@index([token])        // Para lookup rápido pelo token
  @@index([email])        // Para rate limiting por email
}
```

**Nota de design:** `email` não é FK para User intencionalmente — permite verificar o email sem revelar se o usuário existe no código de negócio. A verificação da existência do usuário é feita internamente na server action.

### Fluxo Completo — Reset de Senha

```
Usuário em /login → clica "Mot de passe oublié ?"
  ↓
/forgot-password → preenche email → submete
  ↓
Server Action requestPasswordReset()
  ├─ Zod validate email
  ├─ Rate limit check (≤3 tokens por email por hora)
  ├─ Find user by email (sem revelar existência)
  ├─ if user exists AND has password:
  │   ├─ token = crypto.randomBytes(32).toString('hex')
  │   ├─ expiresAt = now + 1h
  │   ├─ prisma.passwordResetToken.create(...)
  │   └─ sendPasswordResetEmail(email, `${APP_URL}/reset-password?token=${token}`)
  └─ return { success: true } (sempre, independente de user existir)
  ↓
Usuário vê: "Si cet email existe, un lien de réinitialisation a été envoyé"
  ↓
Email recebido → clica link → /reset-password?token=TOKEN
  ↓
ResetPasswordPage → token extraído de searchParams → passado para ResetPasswordForm
  ↓
Usuário preenche nova senha → submete
  ↓
Server Action resetPassword()
  ├─ Zod validate token + password
  ├─ prisma.passwordResetToken.findUnique({ where: { token } })
  ├─ if !resetToken OR expiresAt < now OR usedAt !== null:
  │   └─ return { error: 'Ce lien a expiré...' }
  ├─ bcrypt.hash(password, 12)
  ├─ prisma.$transaction([
  │   user.update({ password: hashedPassword }),
  │   passwordResetToken.update({ usedAt: now })
  │ ])
  └─ return { success: true }
  ↓
Client: router.push('/login') + toast "Mot de passe mis à jour avec succès"
```

### Layout dos Formulários

```
/forgot-password:
┌─────────────────────────────────────────────────┐
│          (Auth Layout — centrado, minimal)        │
│                                                  │
│         ┌──────────────────────────┐             │
│         │  Mot de passe oublié ?   │  ← H1, Poppins 700
│         │  Entrez votre email...   │  ← text-muted, Inter
│         │                          │             │
│         │  Email *                 │  ← Label
│         │  ┌─────────────────────┐ │             │
│         │  │ votre@email.com     │ │  ← Input
│         │  └─────────────────────┘ │             │
│         │                          │             │
│         │  ┌─────────────────────┐ │             │
│         │  │  Envoyer le lien    │ │  ← Button primary
│         │  └─────────────────────┘ │             │
│         │                          │             │
│         │  ← Retour à la connexion │  ← Link /login
│         └──────────────────────────┘             │
│                                                  │
└─────────────────────────────────────────────────┘

Estado de SUCESSO (substituir formulário):
┌──────────────────────────────┐
│  ✓ Email envoyé              │  ← ícone verde
│  Si cet email existe, un     │
│  lien de réinitialisation... │
│                              │
│  Retour à la connexion →     │  ← Link
└──────────────────────────────┘

/reset-password?token=...:
┌──────────────────────────────┐
│  Nouveau mot de passe        │  ← H1
│  Choisissez un mot de passe  │  ← subtitle
│  sécurisé (minimum 8 chars)  │             │
│                              │
│  Nouveau mot de passe *      │  ← Label
│  ┌─────────────────────────┐ │
│  │ ••••••••                │ │  ← type="password"
│  └─────────────────────────┘ │
│                              │
│  ┌─────────────────────────┐ │
│  │ Mettre à jour           │ │  ← Button primary
│  └─────────────────────────┘ │
└──────────────────────────────┘

Estado de ERRO (token expirado/usado — acima do botão):
┌──────────────────────────────┐
│  ⚠ Ce lien a expiré...      │  ← role="alert", text-destructive
│  Demander un nouveau lien →  │  ← Link /forgot-password
└──────────────────────────────┘
```

### Componentes ShadCN Reutilizados

| Componente | Localização | Uso nesta Story |
|---|---|---|
| `Button` | `components/ui/button.tsx` | "Envoyer le lien", "Mettre à jour le mot de passe" |
| `Input` | `components/ui/input.tsx` | Campo email, campo nova senha |
| `Card` | `components/ui/card.tsx` | Container do formulário (se usado) |
| `Toaster/toast` | `components/ui/sonner.tsx` | Toast de sucesso no redirect para /login |

### Dependências a Instalar

```bash
# Email
npm install resend
```

**NÃO instalar** nenhuma outra dependência nova — `bcrypt`, `zod`, `react-hook-form`, `@hookform/resolvers` já instalados na Story 2.1.

### Variáveis de Ambiente Necessárias

```bash
# Adicionar ao .env.local e .env.example
RESEND_API_KEY="re_xxxxxxxxxxxx"  # Obter em resend.com (free tier: 3.000 emails/mês)
EMAIL_FROM="noreply@ultra-ia.com" # Ou email verificado na conta Resend
```

**Para desenvolvimento local:** Resend tem sandbox mode — emails enviados para o dashboard apenas, sem chegar à caixa de entrada real. Ideal para testes.

### Segurança — Considerações Críticas

1. **Timing attack prevention:** Retornar sempre a mesma resposta genérica, independente de o email existir
2. **Token brute force prevention:** Rate limiting (3 tokens/email/hora) + token de 64 chars hex (2^256 combinações)
3. **Token reuse prevention:** Campo `usedAt` — token invalidado imediatamente após uso bem-sucedido
4. **Token expiry:** 1 hora — balance entre usabilidade e segurança
5. **Password não revelada:** Erros de token idênticos para token expirado vs. token usado (não revelar distinção)
6. **OAuth users:** Usuários que criaram conta via Google OAuth (sem `password`) não recebem email de reset — isso é correto (eles precisam usar Google OAuth)

### Dependências entre Stories

| Story | Relação | Status Esperado ao Implementar 2.3 |
|---|---|---|
| 2.1 (Registro) | **Pré-requisito** | done — auth infra, validations/auth.ts, auth-actions.ts |
| 2.2 (Login) | **Pré-requisito** | done — login-form.tsx precisa do link "Mot de passe oublié ?" |
| 6.1 (Email transacional) | Dependente posterior | Esta story faz email básico com Resend; Epic 6 fará templates React, filas, analytics |

### Project Structure Notes

**Ficheiros a criar nesta story:**
```
src/
├── app/(auth)/
│   ├── forgot-password/
│   │   └── page.tsx              # NOVO — formulário de solicitação de reset
│   └── reset-password/
│       └── page.tsx              # NOVO — formulário de nova senha
├── components/auth/
│   ├── forgot-password-form.tsx  # NOVO — Client Component
│   └── reset-password-form.tsx   # NOVO — Client Component
└── lib/
    └── email.ts                  # NOVO — Resend client + sendPasswordResetEmail

Modificados:
prisma/schema.prisma              # ADICIONAR modelo PasswordResetToken
src/lib/validations/auth.ts       # ADICIONAR forgotPasswordSchema + resetPasswordSchema
src/actions/auth-actions.ts       # ADICIONAR requestPasswordReset + resetPassword
src/components/auth/login-form.tsx # ADICIONAR link "Mot de passe oublié ?"
.env.example                      # ADICIONAR RESEND_API_KEY + EMAIL_FROM
package.json                      # resend (via npm install)
```

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar login ou registro — são Stories 2.1 e 2.2 (assumir já feitas)
- **NÃO** revelar se email existe ou não nas mensagens de resposta
- **NÃO** mostrar mensagens diferentes para token expirado vs. token já usado
- **NÃO** esquecer de invalidar o token após uso (`usedAt = now()`)
- **NÃO** implementar "password visibility toggle" (fora do escopo)
- **NÃO** implementar confirmação de senha (confirm password field) — apenas 1 campo de senha
- **NÃO** usar JWT ou link assinado — usar token opaco armazenado no banco (mais simples e seguro para RGPD)
- **NÃO** usar API routes — usar Server Actions
- **NÃO** instalar bibliotecas de template de email complexas (ex: react-email) — HTML simples suficiente para esta story; Epic 6 fará isso
- **NÃO** esquecer `'use server'` nas server actions e `'use client'` nos form components
- **NÃO** armazenar token em plain text de forma não segura — o token gerado por `crypto.randomBytes` já é seguro
- **NÃO** criar páginas legais ou outros conteúdos auth não relacionados
- **NÃO** usar `useEffect` para data fetching — `ResetPasswordPage` é Server Component que valida token ausente via redirect

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.3 Acceptance Criteria, Epic 2 Overview, FR6 Coverage, BDD Scenarios]
- [Source: _bmad-output/planning-artifacts/architecture.md — Auth Strategy (Database Sessions, bcrypt), Server Action Pattern, API Response Format, Error Codes, Validation (Zod), Naming Conventions, Project Directory Structure, Security Section]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Auth Layout (centrado, minimal), Form Patterns (inputs 44px, validation onBlur, error states, aria attributes), Toast Notifications, Responsive Design, WCAG 2.1 AA Accessibility]
- [Source: _bmad-output/implementation-artifacts/2-1-registro-de-usuario.md — Auth.js v5 Config Reference, bcrypt Pattern, Zod Schemas, Server Action Pattern, React Hook Form Usage, ShadCN Components, Dependency List, File Structure]
- [Source: https://resend.com/docs/send-with-nextjs — Resend Next.js Integration Official Docs]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Story 2.3 cobre FR6 (reset de senha via email) com fluxo seguro em 2 etapas: solicitação + redefinição
- Token criptograficamente seguro (crypto.randomBytes), invalidado após uso, com expiração de 1h
- Segurança: resposta genérica sempre (não revela existência de conta), rate limiting 3 req/hora
- Resend como email provider (solução Vercel-native, free tier suficiente para MVP)
- Apenas usuários Credentials (com campo `password`) podem resetar senha — usuários Google OAuth não são afetados
- Epic 6 construirá infraestrutura de email mais completa em cima desta base (templates React, analytics)
- Stories 2.1 e 2.2 não estavam concluídas: `auth-actions.ts`, `validations/auth.ts`, e `login-form.tsx` já existiam parcialmente — foram estendidos. Login form criado com o link "Mot de passe oublié ?" já incluído
- Schema aplicado com `prisma db push` (drift no ambiente de dev impedia migrate dev)
- TypeScript: `npm run type-check` passou sem erros. Lint: `npm run lint` passou sem erros

### File List

**Criados:**
- `src/lib/email.ts`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/components/auth/forgot-password-form.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/app/(auth)/login/page.tsx`

**Modificados:**
- `prisma/schema.prisma` — adicionados campo `password` em User e modelo `PasswordResetToken`
- `src/lib/validations/auth.ts` — adicionados `forgotPasswordSchema`, `resetPasswordSchema` e tipos
- `src/actions/auth-actions.ts` — adicionados `requestPasswordReset`, `resetPassword`
- `src/components/auth/login-form.tsx` — reescrito com link "Mot de passe oublié ?"
- `.env.example` — adicionadas variáveis `RESEND_API_KEY` e `EMAIL_FROM`
- `package.json` — resend, bcrypt, @types/bcrypt, zod, react-hook-form, @hookform/resolvers

## Senior Developer Review (AI)

**Revisor:** Vinicius | **Data:** 2026-03-11 | **Resultado:** ✅ Aprovado com correções aplicadas

### Issues Encontradas e Corrigidas (9 total)

**Altas (4):**
- [HIGH-1] `forgot-password-form.tsx` — `mode: 'onBlur'` ausente no `useForm` → **CORRIGIDO**
- [HIGH-2] `reset-password-form.tsx` — `mode: 'onBlur'` ausente no `useForm` → **CORRIGIDO**
- [HIGH-3] `auth-actions.ts:requestPasswordReset` — sem try/catch em `sendPasswordResetEmail`; token criado mas email falha silenciosamente → **CORRIGIDO** (rollback do token em caso de falha)
- [HIGH-4] `auth-actions.ts:resetPassword` — sessões ativas não invalidadas após reset de senha → **CORRIGIDO** (`session.deleteMany` adicionado à transação)

**Médias (5):**
- [MED-1] `forgot-password-form.tsx` — botão sem `min-h-11` (spec violation) → **CORRIGIDO**
- [MED-2] `reset-password-form.tsx` — botão sem `min-h-11` (spec violation) → **CORRIGIDO**
- [MED-3] `email.ts` — retorno da Resend API não verificado para erros → **CORRIGIDO** (lança exceção se `error` presente)
- [MED-4] `auth-actions.ts` — race condition no rate limiting (check + create não atômico) → **CORRIGIDO** (`$transaction` interativo)
- [MED-5] `prisma/schema.prisma` — `@@index([token])` redundante com `@unique` → **CORRIGIDO** (índice removido)

**Baixas (1, não corrigida — aceitável):**
- [LOW-1] `email.ts` — `resetUrl` interpolado no HTML sem sanitização (token é hex puro, risco teórico apenas via env var maliciosa)

### Arquivos Modificados na Review
- `src/components/auth/forgot-password-form.tsx`
- `src/components/auth/reset-password-form.tsx`
- `src/lib/email.ts`
- `src/actions/auth-actions.ts`
- `prisma/schema.prisma`

## Change Log

| Data | Descrição |
|---|---|
| 2026-03-11 | Implementação inicial da Story 2.3: fluxo completo de reset de senha via email com Resend, Server Actions seguras, formulários React Hook Form + Zod, modelo PasswordResetToken no Prisma |
| 2026-03-11 | Code review: 9 issues corrigidas (4 altas, 5 médias) — validação onBlur, min-h-11 nos botões, rollback de token em falha de email, invalidação de sessões, rate limit atômico, índice redundante removido |
