---
title: 'Fluxo de Invite para Expert'
slug: 'expert-invite-flow'
created: '2026-03-19'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack:
  - 'Next.js 15 App Router'
  - 'TypeScript strict'
  - 'Prisma 7 + PrismaPg'
  - 'Auth.js v5 (next-auth 5 beta)'
  - 'Resend (email transacional)'
  - 'Zod 4'
  - 'bcrypt (salt=12)'
  - 'crypto.randomBytes(32)'
files_to_modify:
  - 'prisma/schema.prisma'
  - 'src/lib/validations/email.ts'
  - 'src/lib/email-templates.ts'
  - 'src/lib/email.ts'
  - 'src/components/admin/specialist-owner-card.tsx'
  - 'src/app/(admin)/admin/agents/[id]/dashboard/page.tsx'
  - 'src/lib/i18n/fr.ts'
  - 'src/lib/i18n/en.ts'
files_to_create:
  - 'src/actions/admin-invite-actions.ts'
  - 'src/app/(auth)/accept-invite/page.tsx'
  - 'src/components/auth/accept-invite-form.tsx'
  - 'src/app/(auth)/accept-invite/google-callback/page.tsx'
code_patterns:
  - 'PasswordResetToken → ExpertInviteToken (mesmo padrão: token hex, expiresAt, usedAt)'
  - 'crypto.randomBytes(32).toString("hex") para geração de token'
  - 'prisma.$transaction para operações atômicas'
  - 'sendEmail({ to, template, variables }) → EMAIL_TEMPLATES const + Zod schema + template function'
  - 'requireAdmin() guard em todas as Server Actions admin'
  - 'Server Components por padrão, "use client" apenas quando necessário'
  - 'buttonVariants para links com aparência de botão'
  - '@base-ui/react com render={} prop (não asChild)'
  - 'Retorno padronizado: { success: true, data } | { success: false, error: { code, message } }'
test_patterns:
  - 'Projeto sem cobertura de testes — não criar'
---

# Tech-Spec: Fluxo de Invite para Expert

**Created:** 2026-03-19

## Overview

### Problem Statement

Admin cria Specialists manualmente no painel `/admin/agents`, mas não existe mecanismo para convidar o expert a criar sua conta. O processo atual é 100% manual: admin pede ao expert para se registrar em `/register`, depois promove o usuário para `EXPERT` manualmente via painel de usuários, e por fim vincula o Specialist ao expert via `SpecialistOwnerCard`. Sem rastreabilidade, sem notificação, sem UX.

### Solution

Sistema de convite por e-mail com token seguro. Admin digita o e-mail do expert na `SpecialistOwnerCard` → sistema gera token único `ExpertInviteToken` com expiração de 7 dias → envia e-mail transacional via Resend → expert clica no link `/accept-invite?token=xxx` → cria conta com senha ou usa Google OAuth → ao aceitar, role é promovida para `EXPERT` e o Specialist é vinculado atomicamente. Se o e-mail já existe como USER, aplica promoção + link + notificação sem criar nova conta.

### Scope

**In Scope:**
1. Novo modelo `ExpertInviteToken` no schema Prisma (padrão `PasswordResetToken` + campo `specialistId`)
2. Server Actions em `admin-invite-actions.ts`: `sendExpertInvite`, `resendExpertInvite`, `getSpecialistPendingInvite`, `acceptInviteWithPassword`, `acceptInviteViaOAuth`
3. `SpecialistOwnerCard`: novo campo "Convidar por e-mail" + badge de status do invite + botão "Reenviar"
4. Página `/accept-invite` (grupo `(auth)`): formulário nome+senha para nova conta OU Google OAuth
5. Página `/accept-invite/google-callback`: Server Component que consome invite pós-OAuth Google
6. Template de e-mail `expert-invite` no padrão existente (Resend + `wrapLayout`)
7. Re-invite: invalida tokens anteriores do mesmo `specialistId` + cria novo + reenvia e-mail
8. Usuário existente (USER): promoção automática de role + link de Specialist + e-mail de notificação
9. Usuário já logado ao acessar o link: auto-aplica invite sem formulário

**Out of Scope:**
- Expert convidando outros experts
- Fluxo de invite para team members (`ExpertTeamMember` já existente)
- Painel para expert gerenciar seus próprios invites
- Invite direto pelo formulário de criação do Specialist

## Context for Development

### Codebase Patterns

**Token pattern — replicar de `PasswordResetToken` (schema.prisma:63):**
```typescript
model ExpertInviteToken {
  id           String     @id @default(cuid())
  token        String     @unique
  email        String
  specialistId String
  expiresAt    DateTime
  usedAt       DateTime?
  createdAt    DateTime   @default(now())
  specialist   Specialist @relation(fields: [specialistId], references: [id], onDelete: Cascade)
  @@index([email])
  @@index([specialistId])
  @@map("expert_invite_tokens")
}
// Adicionar em Specialist: inviteTokens ExpertInviteToken[]
```

**Token generation — padrão de `auth-actions.ts:120`:**
```typescript
import crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex');
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
```

**Email pipeline — adicionar em 3 arquivos:**
```typescript
// 1. src/lib/validations/email.ts
export const expertInviteSchema = baseEmailVariablesSchema.extend({
  specialistName: z.string().min(1),
  inviteUrl: z.string().url(),
})
// EMAIL_TEMPLATES.EXPERT_INVITE = 'expert-invite'
// emailSchemaMap['expert-invite'] = expertInviteSchema

// 2. src/lib/email-templates.ts
export function expertInviteTemplate(vars: { userName: string; specialistName: string; inviteUrl: string })
// Adicionar a templateFunctions map

// 3. src/lib/email.ts
export async function sendExpertInviteEmail(email, inviteUrl, specialistName, userName?)
```

**Server Action guard — de `admin-actions.ts:15`:**
```typescript
'use server';
import { requireAdmin } from '@/lib/auth-helpers';
export async function sendExpertInvite(...) {
  const auth = await requireAdmin();
  if ('error' in auth) return { success: false, error: auth.error };
  // retorno: { success: true, data } | { success: false, error: { code, message } }
}
```

**Atomic transaction — de `auth-actions.ts:181`:**
```typescript
await prisma.$transaction([
  prisma.user.update({ where: { id: userId }, data: { role: 'EXPERT' } }),
  prisma.specialist.update({ where: { id: specialistId }, data: { ownerId: userId } }),
  prisma.expertInviteToken.update({ where: { token }, data: { usedAt: now } }),
]);
```

**Google OAuth accept flow:**
```typescript
// Em accept-invite-form.tsx (client):
import { signIn } from 'next-auth/react';
signIn('google', { callbackUrl: `/accept-invite/google-callback?token=${token}` });

// Em /accept-invite/google-callback/page.tsx (Server Component):
const session = await auth();
if (!session) redirect('/login');
const result = await acceptInviteViaOAuth(token, session.user.id);
if (result.success) redirect('/expert/dashboard');
```

**Usuário logado auto-aceita:**
```typescript
// Em /accept-invite/page.tsx (Server Component):
const session = await auth();
if (session?.user?.email === inviteToken.email) {
  const result = await acceptInviteViaOAuth(token, session.user.id);
  if (result.success) redirect('/expert/dashboard');
}
```

**i18n — Server:** `getT()` de `@/lib/i18n/get-t`
**i18n — Client:** `useT()` de `@/lib/i18n/use-t`
**Chaves novas:** `admin.inviteExpert.*` e `acceptInvite.*`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `prisma/schema.prisma:63` | `PasswordResetToken` — modelo a replicar como `ExpertInviteToken` |
| `src/actions/auth-actions.ts:108` | `requestPasswordReset` — padrão completo de token (geração, transaction, rate-limit) |
| `src/actions/auth-actions.ts:147` | `resetPassword` — padrão de consumo de token com `usedAt` |
| `src/actions/admin-actions.ts:176` | `assignSpecialistOwner` — será chamado internamente no accept |
| `src/actions/admin-user-actions.ts:76` | `updateUserRole` — lógica de promoção a referenciar |
| `src/lib/email.ts` | `sendEmail`, `sendPasswordResetEmail` helper — padrão a replicar |
| `src/lib/email-templates.ts` | `wrapLayout`, `escapeHtml`, `templateFunctions` map |
| `src/lib/validations/email.ts` | `EMAIL_TEMPLATES`, `emailSchemaMap`, schema pattern |
| `src/components/admin/specialist-owner-card.tsx` | Componente a modificar — adicionar seção invite |
| `src/app/(admin)/admin/agents/[id]/dashboard/page.tsx` | Página que renderiza `SpecialistOwnerCard` — adicionar query de pendingInvite |
| `src/app/(auth)/reset-password/page.tsx` | Referência de layout e estrutura para `/accept-invite` |
| `src/lib/auth.ts` | `auth()` para sessão; `signIn` importado de `next-auth/react` no cliente |
| `src/lib/constants.ts` | `APP_URL` para construir invite URL |
| `src/lib/i18n/fr.ts` | Adicionar chaves de i18n (define o tipo `Translation`) |
| `src/lib/i18n/en.ts` | Espelhar chaves de i18n (importa o tipo) |

### Technical Decisions

1. **`ExpertInviteToken` tem `specialistId`** além do e-mail — permite invalidar invites anteriores do mesmo specialist ao reenviar e associar diretamente sem lookups duplos.

2. **Invalidação ao reenviar**: `updateMany({ where: { specialistId, usedAt: null }, data: { usedAt: now } })` antes de criar novo token. Impede múltiplos links válidos simultâneos.

3. **Google OAuth via `callbackUrl`**: mais simples que modificar callbacks de `auth.ts`. Token permanece na URL durante o fluxo, e o Server Component `/google-callback` o consome pós-retorno.

4. **`acceptInviteViaOAuth(token, userId)` verifica `await auth()`** internamente para garantir que o `userId` passado pertence à sessão ativa — não depende apenas do parâmetro.

5. **Usuário existente como USER**: `acceptInviteWithPassword` detecta existência pelo e-mail. Se existe como USER: não cria nova conta, só promove role + vincula Specialist + marca token usado. Retorna `{ isNewUser: false }`.

6. **Erro se já EXPERT com Specialist diferente**: validado em `acceptInviteWithPassword` e `acceptInviteViaOAuth` antes de qualquer escrita.

7. **Falha de e-mail não bloqueia token**: ao contrário — se `sendExpertInviteEmail` falha, o token recém-criado é **deletado** para não deixar token órfão inutilizável. Retorna erro para o admin tentar novamente. (Padrão diferente do password reset, que é mais tolerante, porque aqui o admin precisa de feedback imediato.)

## Implementation Plan

### Tasks

- [x] **Task 1: Adicionar `ExpertInviteToken` ao schema Prisma**
  - File: `prisma/schema.prisma`
  - Action: Adicionar model `ExpertInviteToken` logo após `PasswordResetToken` (linha ~73):
    ```prisma
    model ExpertInviteToken {
      id           String     @id @default(cuid())
      token        String     @unique
      email        String
      specialistId String
      expiresAt    DateTime
      usedAt       DateTime?
      createdAt    DateTime   @default(now())
      specialist   Specialist @relation(fields: [specialistId], references: [id], onDelete: Cascade)
      @@index([email])
      @@index([specialistId])
      @@map("expert_invite_tokens")
    }
    ```
  - Action: Adicionar `inviteTokens ExpertInviteToken[]` no model `Specialist` (após `teamMembers`)
  - Notes: `onDelete: Cascade` garante limpeza automática ao deletar o Specialist

- [x] **Task 2: Rodar migration Prisma**
  - Command: `npx prisma migrate dev --name add_expert_invite_token`
  - Notes: Executar no terminal após Task 1; verificar que a migration criou a tabela `expert_invite_tokens`

- [x] **Task 3: Adicionar template de e-mail `expert-invite`**
  - File A: `src/lib/validations/email.ts`
  - Action A: Adicionar schema:
    ```typescript
    export const expertInviteSchema = baseEmailVariablesSchema.extend({
      specialistName: z.string().min(1),
      inviteUrl: z.string().url(),
    })
    ```
  - Action A: Adicionar `EXPERT_INVITE: 'expert-invite'` ao objeto `EMAIL_TEMPLATES`
  - Action A: Adicionar `[EMAIL_TEMPLATES.EXPERT_INVITE]: expertInviteSchema` ao `emailSchemaMap`
  - File B: `src/lib/email-templates.ts`
  - Action B: Adicionar função `expertInviteTemplate` (antes do `templateFunctions` map):
    ```typescript
    export function expertInviteTemplate(vars: {
      userName: string; specialistName: string; inviteUrl: string
    }): { subject: string; html: string } {
      const safeUserName = escapeHtml(vars.userName)
      const safeSpecialistName = escapeHtml(vars.specialistName)
      const content = `
        <h1 style="${EMAIL_STYLES.heading}">Você foi convidado como Expert!</h1>
        <p style="${EMAIL_STYLES.body}">
          Bonjour ${safeUserName},<br><br>
          Vous avez été invité à gérer le spécialiste IA
          <strong>${safeSpecialistName}</strong> sur ultra-ia.
          Cliquez sur le bouton ci-dessous pour créer votre compte expert.
          Ce lien expire dans <strong>7 jours</strong>.
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${vars.inviteUrl}" style="${EMAIL_STYLES.button}">Accepter l'invitation</a>
        </p>
        <p style="${EMAIL_STYLES.muted}">
          Si vous n'attendiez pas cette invitation, ignorez cet email.
        </p>
      `
      return {
        subject: `Invitation Expert — ${safeSpecialistName}`,
        html: wrapLayout(content),
      }
    }
    ```
  - Action B: Adicionar `'expert-invite': expertInviteTemplate as ...` ao `templateFunctions` map
  - File C: `src/lib/email.ts`
  - Action C: Adicionar helper tipado após `sendPasswordResetEmail`:
    ```typescript
    export async function sendExpertInviteEmail(
      email: string,
      inviteUrl: string,
      specialistName: string,
      userName = 'Expert',
    ): Promise<void> {
      const result = await sendEmail({
        to: email,
        template: EMAIL_TEMPLATES.EXPERT_INVITE,
        variables: { userName, specialistName, inviteUrl },
      })
      if (!result.success) {
        throw new Error(`Failed to send expert invite email: ${result.error?.message}`)
      }
    }
    ```

- [x] **Task 4: Criar `src/actions/admin-invite-actions.ts`**
  - File: `src/actions/admin-invite-actions.ts` (criar novo)
  - Action: `'use server'` — imports: `crypto`, `prisma`, `requireAdmin`, `sendExpertInviteEmail`, `APP_URL`, Sentry
  - Action: Implementar `sendExpertInvite(specialistId: string, email: string)`:
    1. `requireAdmin()` guard
    2. Validar e-mail com Zod (`z.string().email()`)
    3. Buscar specialist — se não existe: retornar `NOT_FOUND`
    4. Se specialist já tem `ownerId`: retornar `CONFLICT` ("Specialist já possui um expert vinculado")
    5. Buscar user pelo e-mail:
       - Se EXPERT com `ownedSpecialist` diferente: retornar `CONFLICT`
       - (USER ou inexistente: prosseguir normalmente)
    6. `await prisma.expertInviteToken.updateMany({ where: { specialistId, usedAt: null }, data: { usedAt: new Date() } })` — invalida tokens anteriores
    7. Gerar token e criar `ExpertInviteToken`
    8. Tentar `sendExpertInviteEmail` — se falhar: deletar o token criado + retornar erro
    9. Retornar `{ success: true, data: { email } }`
  - Action: Implementar `resendExpertInvite(specialistId: string)`:
    1. `requireAdmin()` guard
    2. Buscar specialist — se não existe: `NOT_FOUND`
    3. Se specialist já tem `ownerId`: retornar `CONFLICT`
    4. Buscar último invite ativo (ou expirado) para o specialistId para extrair o e-mail
    5. Se nenhum invite encontrado: retornar `NOT_FOUND` ("Nenhum invite anterior encontrado")
    6. Invalidar tokens anteriores + gerar novo token + criar novo `ExpertInviteToken`
    7. Tentar `sendExpertInviteEmail` — se falhar: deletar token + retornar erro
    8. Retornar `{ success: true }`
  - Action: Implementar `getSpecialistPendingInvite(specialistId: string)`:
    1. `requireAdmin()` guard
    2. Buscar o invite mais recente para o `specialistId` (`orderBy: { createdAt: 'desc' }`, `take: 1`)
    3. Retornar `{ success: true, data: { email, expiresAt, isExpired: expiresAt < new Date(), usedAt } | null }`
  - Action: Implementar `acceptInviteWithPassword(token: string, name: string, password: string)`:
    1. SEM `requireAdmin()` — é público
    2. Validar: `name` min 2 chars, `password` min 8 chars (Zod)
    3. Buscar token: se não existe, `expiresAt < now`, ou `usedAt !== null`: retornar `INVALID_TOKEN`
    4. Buscar user pelo `token.email`:
       - **Se EXPERT com `ownedSpecialist` diferente**: retornar `CONFLICT`
       - **Se USER (existe)**: transaction:
         ```typescript
         await prisma.$transaction([
           prisma.user.update({ where: { email }, data: { role: 'EXPERT' } }),
           prisma.specialist.update({ where: { id: token.specialistId }, data: { ownerId: user.id } }),
           prisma.expertInviteToken.update({ where: { token }, data: { usedAt: now } }),
         ]);
         ```
         Retornar `{ success: true, data: { isNewUser: false } }`
       - **Se não existe**: hash password, transaction:
         ```typescript
         const newUser = await prisma.user.create({ data: { name, email, password: hashedPwd, role: 'EXPERT' } });
         await prisma.$transaction([
           prisma.specialist.update({ where: { id: token.specialistId }, data: { ownerId: newUser.id } }),
           prisma.expertInviteToken.update({ where: { token }, data: { usedAt: now } }),
         ]);
         ```
         Retornar `{ success: true, data: { isNewUser: true } }`
  - Action: Implementar `acceptInviteViaOAuth(token: string, userId: string)`:
    1. SEM `requireAdmin()` — chamado pós-OAuth
    2. Verificar sessão com `await auth()` — se `session.user.id !== userId`: retornar `FORBIDDEN`
    3. Buscar token: se não existe, expirado, ou usado: retornar `INVALID_TOKEN`
    4. Buscar user pelo `userId`:
       - Se `user.email !== token.email`: retornar `FORBIDDEN` ("Este link não pertence à sua conta")
       - Se EXPERT com `ownedSpecialist` diferente: retornar `CONFLICT`
    5. Transaction: promover role + vincular specialist + marcar token usado
    6. Retornar `{ success: true }`
  - Notes: Todos os retornos seguem o padrão `{ success: true/false, error?: { code, message } }`; audit log para ações admin com `console.log(JSON.stringify({ audit: 'admin_action', action: 'send_expert_invite', ... }))`

- [x] **Task 5: Adicionar chaves i18n**
  - File A: `src/lib/i18n/fr.ts` (adicionar ao objeto de tradução, na seção `admin`)
    ```typescript
    inviteExpert: {
      sectionTitle: 'Inviter un Expert',
      emailLabel: 'Email de l\'expert',
      emailPlaceholder: 'expert@domaine.com',
      sendInvite: 'Envoyer l\'invitation',
      sending: 'Envoi en cours...',
      invitePending: 'Invitation envoyée à {email}',
      inviteExpired: 'Invitation expirée ({email})',
      resendInvite: 'Renvoyer',
      resending: 'Renvoi...',
      inviteSuccess: 'Invitation envoyée avec succès',
      resendSuccess: 'Invitation renvoyée avec succès',
      inviteError: 'Échec de l\'envoi de l\'invitation',
    },
    ```
  - File A: `src/lib/i18n/fr.ts` (adicionar seção `acceptInvite` no nível raiz)
    ```typescript
    acceptInvite: {
      title: 'Accepter l\'invitation Expert',
      subtitleNew: 'Créez votre compte pour gérer {specialistName}',
      subtitleExisting: 'Votre compte va être mis à jour pour {specialistName}',
      nameLabel: 'Votre nom',
      passwordLabel: 'Mot de passe',
      confirmPasswordLabel: 'Confirmer le mot de passe',
      submit: 'Créer mon compte Expert',
      submitting: 'Création en cours...',
      orContinueWith: 'ou continuer avec',
      continueWithGoogle: 'Continuer avec Google',
      successNew: 'Compte Expert créé ! Bienvenue.',
      successExisting: 'Votre compte a été mis à jour. Bienvenue en tant qu\'Expert !',
      errorExpired: 'Ce lien a expiré ou a déjà été utilisé.',
      errorConflict: 'Cet email est déjà associé à un autre spécialiste.',
      errorMismatch: 'Ce lien ne correspond pas à votre compte connecté.',
    },
    ```
  - File B: `src/lib/i18n/en.ts` — espelhar todas as chaves com traduções em inglês

- [x] **Task 6: Atualizar dashboard page para passar `pendingInvite`**
  - File: `src/app/(admin)/admin/agents/[id]/dashboard/page.tsx`
  - Action: Adicionar query no `Promise.all` (linha ~37):
    ```typescript
    prisma.expertInviteToken.findFirst({
      where: { specialistId: id },
      orderBy: { createdAt: 'desc' },
      select: { email: true, expiresAt: true, usedAt: true },
    }),
    ```
  - Action: Desestruturar o resultado como `pendingInviteRaw` na linha ~37 e processar:
    ```typescript
    const pendingInvite = pendingInviteRaw && !pendingInviteRaw.usedAt
      ? {
          email: pendingInviteRaw.email,
          expiresAt: pendingInviteRaw.expiresAt,
          isExpired: pendingInviteRaw.expiresAt < new Date(),
        }
      : null;
    ```
  - Action: Passar `pendingInvite={pendingInvite}` para `<SpecialistOwnerCard />`

- [x] **Task 7: Modificar `SpecialistOwnerCard` para suportar invite**
  - File: `src/components/admin/specialist-owner-card.tsx`
  - Action: Adicionar prop `pendingInvite?: { email: string; expiresAt: Date; isExpired: boolean } | null` à interface `SpecialistOwnerCardProps`
  - Action: Adicionar estado `inviteEmail` (string) e `isSendingInvite` (boolean)
  - Action: Adicionar imports: `sendExpertInvite`, `resendExpertInvite` de `@/actions/admin-invite-actions`; `Mail`, `RefreshCw` de `lucide-react`; `Input` (já importado)
  - Action: No bloco de "sem owner", substituir ou complementar o Dialog de busca de EXPERT existente com:
    - Se `pendingInvite` existe e não expirado: exibir badge "Invite enviado para {email}" + botão "Reenviar" (chama `resendExpertInvite`)
    - Se `pendingInvite` existe e expirado: exibir badge "Invite expirado" + botão "Reenviar"
    - Se `pendingInvite` é null: exibir input de e-mail + botão "Enviar convite" (chama `sendExpertInvite`)
  - Action: Manter o Dialog de busca de EXPERT existente como segunda opção ("Vincular expert existente")
  - Notes: Usar `useTransition` para pending states; `toast.success`/`toast.error` para feedback; `router.refresh()` após sucesso

- [x] **Task 8: Criar página `/accept-invite`**
  - File: `src/app/(auth)/accept-invite/page.tsx` (criar novo)
  - Action: Server Component (sem `'use client'`)
  - Action: Imports: `auth` de `@/lib/auth`, `prisma` de `@/lib/prisma`, `redirect` de `next/navigation`, `getT` de `@/lib/i18n/get-t`, `acceptInviteViaOAuth` de `@/actions/admin-invite-actions`, `AcceptInviteForm` de `@/components/auth/accept-invite-form`
  - Action: Props: `searchParams: Promise<{ token?: string; error?: string }>`
  - Action: Lógica:
    ```typescript
    const { token, error } = await searchParams;
    if (!token) redirect('/login');

    const inviteToken = await prisma.expertInviteToken.findUnique({
      where: { token },
      include: { specialist: { select: { name: true } } },
    });

    // Token inválido/expirado/usado
    if (!inviteToken || inviteToken.usedAt || inviteToken.expiresAt < new Date()) {
      // Renderizar tela de erro com t.acceptInvite.errorExpired
    }

    // Usuário já logado com e-mail correspondente
    const session = await auth();
    if (session?.user?.email === inviteToken.email) {
      const result = await acceptInviteViaOAuth(token, session.user.id);
      if (result.success) redirect('/expert/dashboard');
      // Se erro: renderizar erro específico
    }
    ```
  - Action: Renderizar `<AcceptInviteForm token={token} specialistName={inviteToken.specialist.name} targetEmail={inviteToken.email} />`
  - Notes: Usar layout visual similar a `reset-password/page.tsx`

- [x] **Task 9: Criar `AcceptInviteForm` (client component)**
  - File: `src/components/auth/accept-invite-form.tsx` (criar novo)
  - Action: `'use client'`
  - Action: Props: `token: string`, `specialistName: string`, `targetEmail: string`
  - Action: React Hook Form com Zod:
    ```typescript
    const schema = z.object({
      name: z.string().min(2, 'Minimum 2 caractères'),
      password: z.string().min(8, 'Minimum 8 caractères'),
      confirmPassword: z.string(),
    }).refine(d => d.password === d.confirmPassword, {
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword'],
    });
    ```
  - Action: Submit → `acceptInviteWithPassword(token, name, password)` → se sucesso: `router.push('/expert/dashboard')`; se erro: `toast.error(result.error.message)`
  - Action: Botão Google → `signIn('google', { callbackUrl: \`/accept-invite/google-callback?token=${token}\` })` (import de `next-auth/react`)
  - Action: Mostrar `targetEmail` como info (campo não editável — o expert sabe para qual conta é o invite)
  - Notes: `useT()` para strings; botão de submit com `disabled={isSubmitting}`

- [x] **Task 10: Criar página `/accept-invite/google-callback`**
  - File: `src/app/(auth)/accept-invite/google-callback/page.tsx` (criar novo)
  - Action: Server Component
  - Action: Props: `searchParams: Promise<{ token?: string }>`
  - Action: Lógica:
    ```typescript
    const session = await auth();
    if (!session?.user) redirect('/login');

    const { token } = await searchParams;
    if (!token) redirect('/login');

    const result = await acceptInviteViaOAuth(token, session.user.id);
    if (result.success) redirect('/expert/dashboard');
    redirect(`/accept-invite?token=${token}&error=${result.error?.code ?? 'UNKNOWN'}`);
    ```
  - Notes: Página puramente de lógica — sem renderização visual. Redireciona sempre.

### Acceptance Criteria

- [x] **AC 1:** Dado que admin abre `SpecialistOwnerCard` de um Specialist sem owner e sem invite, quando digita um e-mail válido e clica "Enviar convite", então um `ExpertInviteToken` é criado no banco, o e-mail de invite é enviado via Resend, e o badge "Invite enviado para {email}" aparece na card.

- [x] **AC 2:** Dado que um invite pendente existe, quando admin clica "Reenviar", então o token anterior é marcado como `usedAt`, um novo token é criado, o e-mail é reenviado, e o badge atualiza com o novo status.

- [x] **AC 3:** Dado que um expert recebe o link de invite e não tem conta, quando preenche nome e senha no formulário e envia, então uma conta com `role: EXPERT` é criada, o `ownerId` do Specialist é definido, o token é marcado como usado, e o expert é redirecionado para `/expert/dashboard`.

- [x] **AC 4:** Dado que o link de invite é acessado, quando o expert clica "Continuar com Google", completa o OAuth e retorna ao `/accept-invite/google-callback?token=...`, então a role é promovida para `EXPERT`, o Specialist é vinculado, o token é consumido, e o expert vai para `/expert/dashboard`.

- [x] **AC 5:** Dado que o e-mail do invite pertence a um usuário já registrado como USER, quando o invite é aceito (via senha ou Google), então nenhuma nova conta é criada, a role existente é promovida para `EXPERT`, o Specialist é vinculado, e o token é consumido.

- [x] **AC 6:** Dado que o expert está logado com o mesmo e-mail do invite, quando acessa `/accept-invite?token=xxx`, então o invite é auto-aplicado sem formulário, e o expert é imediatamente redirecionado para `/expert/dashboard`.

- [x] **AC 7:** Dado um token expirado (mais de 7 dias) ou já utilizado, quando a URL é acessada, então a página exibe a mensagem de erro `t.acceptInvite.errorExpired` e não aplica nenhuma alteração.

- [x] **AC 8:** Dado que o e-mail do invite pertence a um usuário já EXPERT com um Specialist diferente, quando tenta aceitar o invite, então o erro `CONFLICT` é retornado com mensagem adequada e nenhuma alteração é feita.

- [x] **AC 9:** Dado que o envio do e-mail falha (Resend retorna erro), quando admin clica "Enviar convite", então o token criado é deletado, nenhum token órfão fica no banco, e o admin vê mensagem de erro.

- [x] **AC 10:** Dado que um usuário logado com e-mail diferente do invite tenta acessar `/accept-invite?token=xxx`, quando a página processa a sessão, então a mensagem `t.acceptInvite.errorMismatch` é exibida e o invite não é aplicado.

## Additional Context

### Dependencies

- `crypto` (Node built-in) — já usado em `auth-actions.ts`
- `bcrypt` — já instalado (`bcrypt@6.0.0`), salt=12
- `Resend` — já configurado em `src/lib/email.ts`
- `next-auth/react` — `signIn` já disponível (Auth.js v5)
- Env vars: `AUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` — já configuradas
- `requireAdmin` de `src/lib/auth-helpers.ts` — já usado em admin actions
- Nenhum pacote novo necessário

### Testing Strategy

Projeto sem cobertura de testes automatizados. Não criar.

**Checklist de teste manual:**
1. Admin abre dashboard de Specialist sem owner → digita e-mail → envia invite → checar inbox e DB
2. Clicar link do e-mail (novo usuário) → preencher form → verificar login em `/expert/dashboard`
3. Clicar link do e-mail (Google OAuth) → completar OAuth → verificar redirect correto
4. Tentar link expirado → verificar mensagem de erro
5. Admin reenviar invite → checar que token antigo está com `usedAt` preenchido
6. Usuário existente (USER) clicar link → verificar role promovida sem duplicar conta

### Notes

- **Risco alto:** Transaction de promoção de role + vinculação de Specialist deve ser atômica — qualquer falha parcial deixaria dados inconsistentes. Usar `prisma.$transaction([...])`.
- **Risco médio:** Google OAuth callbackUrl deve ser uma URL completa válida aceita pelo provider — verificar configuração de `NEXTAUTH_URL` e trusted redirect URIs no Google Console.
- **Futuro (out of scope):** Adicionar expiração automática de convites (cron job) e listagem de convites pendentes no painel admin de usuários.
- Audit log obrigatório em `sendExpertInvite` e `resendExpertInvite` (padrão: `console.log(JSON.stringify({ audit: 'admin_action', ... }))`).
- ShadCN usa `@base-ui/react`: `render={}` prop nos Triggers (não `asChild`).
- `getT()` apenas em Server Components; `useT()` apenas em Client Components.

## Review Notes
- Adversarial review completed: 10 findings
- Fixed: F1 (EXPERT conflict bug), F2 (race condition), F4 (email case-insensitive), F5 (state cleanup), F7 (unused prop)
- Skipped: F3 (server-generated URL — no real XSS risk), F6 (rate limiting — out of scope), F8 (minor), F9 (action available for future use), F10 (minor a11y)
- Resolution approach: auto-fix
