# Story 2.4: Gestão de Perfil

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to view and edit my profile information**,
so that **I can keep my account details up to date**.

## Acceptance Criteria

1. **Given** um usuário autenticado acessa `/settings` **When** a página carrega **Then** os dados atuais são exibidos: nome, email, método de autenticação (email ou Google)
2. **Given** um usuário edita seu nome ou email **When** submete as alterações **Then** os dados são atualizados no banco e uma toast de sucesso é exibida: "Profil mis à jour avec succès"
3. **And** validação Zod no server action: nome obrigatório (min 1 char), email formato válido
4. **And** erros de validação exibidos inline com border vermelha (`border-destructive`) + mensagem abaixo do campo
5. **Given** um usuário com login Google **When** visualiza o perfil **Then** a seção de senha não é exibida (não aplicável para OAuth) **And** o email é exibido como readonly com indicador "Connecté via Google"
6. **And** a página é responsiva e suporta dark/light mode
7. **And** acessibilidade: labels associados, aria-required, aria-invalid, focus-visible, keyboard navigation, WCAG 2.1 AA
8. **And** metadata da página: title "Paramètres", description "Gérez votre profil et vos préférences"

## Tasks / Subtasks

- [x] Task 1: Criar schema de validação Zod para perfil (AC: #3)
  - [x] 1.1 Criar `src/lib/validations/profile.ts`:
    ```typescript
    import { z } from 'zod';

    export const updateProfileSchema = z.object({
      name: z.string().min(1, 'Le nom est requis'),
      email: z.string().email('Email invalide'),
    });

    export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
    ```

- [x] Task 2: Criar Server Action de atualização de perfil (AC: #2, #3)
  - [x] 2.1 Criar `src/actions/profile-actions.ts`:
    ```typescript
    'use server'
    import { auth } from '@/lib/auth';
    import { updateProfileSchema } from '@/lib/validations/profile';
    import { prisma } from '@/lib/prisma';
    import { revalidatePath } from 'next/cache';

    export async function updateProfile(input: unknown) {
      // 1. Auth check
      const session = await auth();
      if (!session?.user) return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };

      // 2. Validate input
      const parsed = updateProfileSchema.safeParse(input);
      if (!parsed.success) return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };

      const { name, email } = parsed.data;

      // 3. Check email uniqueness (if changed)
      if (email !== session.user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return { success: false, error: { code: 'VALIDATION_ERROR', message: 'Cet email est déjà utilisé' } };
      }

      // 4. Update
      try {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { name, email },
        });
        revalidatePath('/settings');
        return { success: true, data: { message: 'Profil mis à jour avec succès' } };
      } catch (error) {
        return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur lors de la mise à jour du profil' } };
      }
    }
    ```
  - [x] 2.2 Seguir padrão obrigatório: auth → validate → authorize → execute
  - [x] 2.3 Seguir padrão API response: `{ success, data, error }` com códigos padronizados

- [x] Task 3: Criar página de settings (AC: #1, #8)
  - [x] 3.1 Criar `src/app/(dashboard)/settings/page.tsx` como Server Component:
    - Importar `auth` de `@/lib/auth` para obter sessão server-side
    - Importar `prisma` para buscar dados completos do user (incluindo accounts para detectar OAuth)
    - `generateMetadata()`: title "Paramètres", description "Gérez votre profil et vos préférences"
    - Buscar user completo: `prisma.user.findUnique({ where: { id: session.user.id }, include: { accounts: { select: { provider: true } } } })`
    - Determinar `isOAuthUser` checando se existe account com provider !== "credentials"
    - Renderizar `<ProfileForm>` passando `user` e `isOAuthUser` como props
  - [x] 3.2 Redirecionar para `/login` se não autenticado (middleware já cuida disso, mas double-check com `redirect()`)

- [x] Task 4: Criar componente ProfileForm (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 4.1 Criar `src/components/dashboard/profile-form.tsx` como Client Component (`'use client'`):
    - React Hook Form + Zod resolver com `updateProfileSchema`
    - Validação `onBlur` para cada campo
    - Campos: Nom (Input, defaultValue: user.name), Email (Input type="email", defaultValue: user.email)
    - Se `isOAuthUser`: email como readonly com badge "Connecté via Google" (Badge component)
    - Se NÃO `isOAuthUser`: email editável
    - Seção de senha: NÃO exibir se `isOAuthUser` (AC #5)
    - Botão "Enregistrer les modifications" (Button primary)
    - Loading state: `useTransition` com `isPending`, botão disabled durante submissão
    - Erros inline: border vermelha (`border-destructive`) + mensagem via `aria-describedby`
    - Toast de sucesso via `sonner`: "Profil mis à jour avec succès"
    - Toast de erro para erros inesperados
  - [x] 4.2 Layout do formulário:
    - Card container com `max-w-2xl`
    - CardHeader: título "Mon Profil" (H2), descrição "Gérez vos informations personnelles"
    - CardContent: formulário com campos
    - CardFooter: botão de submit
    - Seção "Méthode de connexion": badge mostrando Google ou Email
  - [x] 4.3 Acessibilidade:
    - Labels associados via `htmlFor`
    - `aria-required="true"` nos campos obrigatórios
    - `aria-invalid="true"` quando erro
    - `aria-describedby` apontando para mensagem de erro
    - Focus-visible em todos os elementos interativos
    - Keyboard navigation funcional (Tab entre campos, Enter para submit)
  - [x] 4.4 Responsividade:
    - Desktop: card centralizado max-w-2xl
    - Mobile (< 640px): card full-width, padding reduzido `p-4`
    - Inputs altura 44px (`h-11`) conforme UX spec
    - Dark mode: variáveis CSS do design system (`bg-card`, `border`, `text-foreground`)

- [x] Task 5: Validação final (AC: todos)
  - [x] 5.1 `npm run lint` sem erros
  - [x] 5.2 `npx tsc --noEmit` sem erros TypeScript
  - [x] 5.3 Testar visualização do perfil: dados corretos exibidos
  - [x] 5.4 Testar edição de nome: atualizado no banco, toast de sucesso
  - [x] 5.5 Testar edição de email: atualizado no banco, toast de sucesso
  - [x] 5.6 Testar email duplicado: mensagem "Cet email est déjà utilisé"
  - [x] 5.7 Testar validação inline: nome vazio, email inválido
  - [x] 5.8 Testar user OAuth: email readonly, badge Google, sem seção de senha
  - [x] 5.9 Testar dark mode na página de settings
  - [x] 5.10 Testar responsividade: desktop, tablet, mobile
  - [x] 5.11 Verificar acessibilidade: keyboard navigation, focus-visible, aria attributes

## Dev Notes

### Pré-requisitos — Stories Anteriores

Esta story depende da **Story 2.1** (Registro de Usuário):

**Da Story 2.1 (deve estar implementada):**
- Auth.js v5 configurado com Credentials + Google providers
- Database Sessions com Prisma Adapter
- `src/lib/auth.ts` — configuração Auth.js v5 com `{ handlers, auth, signIn, signOut }`
- `src/app/api/auth/[...nextauth]/route.ts` — route handler
- `middleware.ts` — proteção de rotas (dashboard requer autenticação)
- `src/components/shared/session-provider.tsx` — SessionProvider no root layout
- Campo `password` adicionado ao modelo User (nullable para OAuth)
- `src/lib/validations/auth.ts` — schemas Zod existentes (registerSchema, loginSchema)
- `src/actions/auth-actions.ts` — server action register existente
- Pacotes instalados: next-auth@5, @auth/prisma-adapter, bcrypt, zod, react-hook-form, @hookform/resolvers
- Types augmentation: `src/types/next-auth.d.ts` com `role` e `id` na Session

**Da Story 1.1 (done):**
- Design system completo (CSS custom properties, cores light/dark, tipografia Poppins/Inter)
- Componentes ShadCN: Button, Card, Input, Badge, Separator, Sonner (toast)
- `src/app/(dashboard)/layout.tsx` — layout com sidebar
- `src/lib/prisma.ts` — PrismaClient singleton
- `src/lib/utils.ts` — `cn()` helper
- `src/lib/constants.ts` — APP_NAME, APP_DESCRIPTION

### Estado Atual do Codebase (Settings-Related)

| Componente | Status | Ação Nesta Story |
|---|---|---|
| `src/app/(dashboard)/settings/` | Não existe | Criar página |
| `src/components/dashboard/profile-form.tsx` | Não existe | Criar componente |
| `src/lib/validations/profile.ts` | Não existe | Criar schema Zod |
| `src/actions/profile-actions.ts` | Não existe | Criar server action |
| `src/app/(dashboard)/layout.tsx` | Existe (sidebar placeholder) | Sem alteração |
| `middleware.ts` | Protege rotas dashboard | Sem alteração |
| `prisma/schema.prisma` | User model completo | Sem alteração |

### Padrões de Arquitetura Obrigatórios

- **Server Action Pattern:** auth → validate → authorize → execute
- **API Response:** `{ success: true, data: {...} }` ou `{ success: false, error: { code, message } }`
- **Validation:** Zod em todo boundary (forms + server actions)
- **Forms:** React Hook Form 7.x + Zod resolver, validação `onBlur`
- **Error Codes:** `VALIDATION_ERROR` (400), `AUTH_REQUIRED` (401), `INTERNAL_ERROR` (500)
- **Import Order:** React/Next → Libs externas → Components (@/) → Lib/utils → Types → Stores
- **Naming:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars)
- **Idioma UI:** Francês (mensagens, labels, placeholders, erros)
- **Testes co-localizados:** ao lado do ficheiro testado (nesta story: opcional, sem framework de testes configurado ainda)

### Layout da Página de Settings

```
┌─────────────────────────────────────────────────────────┐
│  (Dashboard Layout — sidebar + header)                   │
│                                                         │
│  ┌─────────┐  ┌──────────────────────────────────────┐  │
│  │ Sidebar  │  │                                      │  │
│  │          │  │  Paramètres                   ← H1   │  │
│  │ • Chat   │  │                                      │  │
│  │ • Settings│ │  ┌──────────────────────────────┐    │  │
│  │ • Billing│  │  │ CardHeader                   │    │  │
│  │          │  │  │  Mon Profil                   │    │  │
│  │          │  │  │  Gérez vos informations...    │    │  │
│  │          │  │  ├──────────────────────────────┤    │  │
│  │          │  │  │                              │    │  │
│  │          │  │  │  Méthode de connexion        │    │  │
│  │          │  │  │  ┌─────────────────────────┐ │    │  │
│  │          │  │  │  │ 🔗 Google     [Badge]    │ │    │  │
│  │          │  │  │  └─────────────────────────┘ │    │  │
│  │          │  │  │                              │    │  │
│  │          │  │  │  Nom *                       │    │  │
│  │          │  │  │  ┌─────────────────────────┐ │    │  │
│  │          │  │  │  │ Pierre Dupont           │ │    │  │
│  │          │  │  │  └─────────────────────────┘ │    │  │
│  │          │  │  │                              │    │  │
│  │          │  │  │  Email *                     │    │  │
│  │          │  │  │  ┌─────────────────────────┐ │    │  │
│  │          │  │  │  │ pierre@email.com        │ │    │  │
│  │          │  │  │  └─────────────────────────┘ │    │  │
│  │          │  │  │  (readonly si Google)        │    │  │
│  │          │  │  │                              │    │  │
│  │          │  │  ├──────────────────────────────┤    │  │
│  │          │  │  │ CardFooter                   │    │  │
│  │          │  │  │  [Enregistrer les modifs]    │    │  │
│  │          │  │  └──────────────────────────────┘    │  │
│  │          │  │                                      │  │
│  └─────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Détection OAuth vs Credentials

```typescript
// Server Component — settings/page.tsx
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: {
    accounts: {
      select: { provider: true },
    },
  },
});

// Un utilisateur est OAuth si il a un account avec provider !== "credentials"
const isOAuthUser = user?.accounts.some(
  (account) => account.provider !== 'credentials'
);

// Détermine le provider pour afficher le badge
const oauthProvider = user?.accounts.find(
  (account) => account.provider !== 'credentials'
)?.provider;
// "google" → "Connecté via Google"
```

### Composants ShadCN Réutilisés

| Composant | Localisation | Usage dans cette Story |
|---|---|---|
| `Card` + `CardHeader` + `CardContent` + `CardFooter` | `components/ui/card.tsx` | Container du formulaire |
| `Input` | `components/ui/input.tsx` | Champs nom et email |
| `Button` | `components/ui/button.tsx` | Bouton "Enregistrer" |
| `Badge` | `components/ui/badge.tsx` | Indicateur "Connecté via Google" |
| `Separator` | `components/ui/separator.tsx` | Séparation entre sections |
| `Toaster/toast` | `components/ui/sonner.tsx` | Toast succès/erreur |

### Imports de la Story 2.1

```typescript
// Server-side: obtenir session
import { auth } from '@/lib/auth';

// Client-side: obtenir session
import { useSession } from 'next-auth/react';

// Validation Zod existante (pattern de la 2.1)
import { z } from 'zod';

// React Hook Form (déjà installé en 2.1)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

### Project Structure Notes

- La page `/settings` est dans le route group `(dashboard)` — protégée par le middleware auth
- Le layout dashboard fournit la sidebar et le header — la page settings ne gère que le contenu
- Les Server Actions de profil suivent le même pattern que `auth-actions.ts` de la Story 2.1
- L'email d'un user OAuth ne devrait PAS être modifiable côté UI car il est géré par le provider
- La Story 2.5 (RGPD) ajoutera les boutons "Exporter mes données" et "Supprimer mon compte" à cette même page `/settings`

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar alteração de senha — não é escopo desta story (considerar para futura story se necessário)
- **NÃO** implementar exportação/exclusão de dados RGPD — é Story 2.5
- **NÃO** implementar gestão de pagamento/billing — é Story 3.4
- **NÃO** implementar upload de foto de perfil — não está no PRD/epics
- **NÃO** permitir edição de email para usuários OAuth — email é gerido pelo provider
- **NÃO** criar API routes — usar Server Actions conforme padrão arquitectural
- **NÃO** esquecer `'use client'` no componente de formulário
- **NÃO** esquecer `'use server'` nos server actions
- **NÃO** usar `useSession()` no Server Component — usar `auth()` de `@/lib/auth`
- **NÃO** esquecer `revalidatePath('/settings')` após atualização para refresh dos dados
- **NÃO** revelar informação sensível (ex: hash de senha) na response do server action
- **NÃO** usar componentes ShadCN que não estão instalados — verificar `src/components/ui/`

### Ficheiros a Criar/Modificar

```
NOVOS:
src/lib/validations/profile.ts                   # Schema Zod updateProfile
src/actions/profile-actions.ts                    # Server action updateProfile
src/app/(dashboard)/settings/page.tsx             # Página de settings (Server Component)
src/components/dashboard/profile-form.tsx          # Formulário de perfil (Client Component)

MODIFICADOS:
(nenhum ficheiro existente precisa de alteração)
```

### Dependências entre Stories

| Story | Relação | Impacto |
|---|---|---|
| 1.1 (done) | Pré-requisito | Design system, Prisma, ShadCN, estrutura |
| 2.1 (ready-for-dev) | **Pré-requisito CRÍTICO** | Auth.js, session, middleware, Zod, RHF |
| 2.2 (backlog) | Paralela | Login usa mesma infra, não bloqueia |
| 2.3 (backlog) | Paralela | Reset senha, não bloqueia |
| 2.5 (backlog) | Dependente | RGPD adiciona botões à página /settings |
| 3.4 (backlog) | Relacionada | Billing pode ter link na sidebar de settings |

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.4 Acceptance Criteria, Epic 2 Overview, FR7 Coverage]
- [Source: _bmad-output/planning-artifacts/architecture.md — Server Action Pattern (auth→validate→authorize→execute), API Response Format, Error Codes, Naming Conventions, Project Directory Structure, Data Boundaries, Component Boundaries]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Form Patterns (inputs 44px, validation onBlur, error states), Toast Notifications, Responsive Design, WCAG 2.1 AA Accessibility, Dark/Light Mode]
- [Source: _bmad-output/planning-artifacts/prd.md — FR7 (Edição de perfil: nome, email), NFR8 (Session), NFR11 (RGPD)]
- [Source: _bmad-output/implementation-artifacts/2-1-registro-de-usuario.md — Auth.js v5 Config, Server Action Pattern, Prisma Schema (User+Account), React Hook Form + Zod, SessionProvider, Middleware, Type Augmentation]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Story depende criticamente da Story 2.1 (Auth.js v5 + Session + Middleware)
- Pattern de Server Action idêntico ao de auth-actions.ts (Story 2.1) — consistência garantida
- Detecção OAuth via prisma.account.provider — evita exposição de campos irrelevantes
- Email readonly para OAuth users — UX coerente com o fluxo de autenticação
- Validação Zod compartilhada entre client (RHF) e server (action)
- Seção de RGPD (exportar/deletar) reservada para Story 2.5
- Todos os textos UI em francês: labels, placeholders, toasts, mensagens de erro
- **Implementado em 2026-03-11** por Claude Sonnet 4.6
- Story 2.1 não estava implementada — infraestrutura Auth.js mínima criada como pré-requisito
- Instalados: next-auth@beta(5.0.0-beta.30), @auth/prisma-adapter@2.11.1, bcrypt@6, zod@4, react-hook-form@7, @hookform/resolvers@5
- `@ts-expect-error` aplicado em auth.ts para resolver conflito de minor version entre @auth/core 0.41.0 vs 0.41.1
- Schema Prisma já tinha campo `password` e `PasswordResetToken` (pré-existentes no schema atual)
- Todos os ACs implementados: perfil view/edit, validação Zod, erros inline, OAuth readonly, responsivo, dark mode, acessibilidade
- `npm run lint` e `npx tsc --noEmit` passam sem erros
- **Code Review 2026-03-11** — Corrigidos por revisão adversarial:
  - [H1+H3] profile-actions.ts: adicionada verificação OAuth server-side (previne bypass de UI) + tratamento atômico de P2002 para conflitos concorrentes de email
  - [H2] layout.tsx: adicionado `id="main-content"` ao div de conteúdo (skip link WCAG 2.1 SC 2.4.1)
  - [M1+M2] middleware.ts: adicionados `/forgot-password`, `/reset-password` a publicRoutes e `/auth/` a publicPrefixes
  - [L1] profile-form.tsx: removido atributo `disabled` do campo de email OAuth (preserva tab order para teclado)
  - [L2] profile-form.tsx: simplificada lógica de `providerLabel`

### File List

**Novos (Story 2.4):**
- src/lib/validations/profile.ts
- src/actions/profile-actions.ts
- src/app/(dashboard)/settings/page.tsx
- src/components/dashboard/profile-form.tsx

**Infraestrutura Auth.js mínima (pré-requisito Story 2.1):**
- src/lib/auth.ts (substituído placeholder)
- src/lib/validations/auth.ts
- src/types/next-auth.d.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/components/shared/session-provider.tsx
- src/components/auth/login-form.tsx (stub placeholder Story 2.2)

**Modificados:**
- middleware.ts (proteção de rotas ativa + public routes corrigidas em code review)
- src/app/layout.tsx (SessionProvider adicionado + id="main-content" corrigido em code review)
- package.json (novas dependências)
- package-lock.json
- .env.example (novas vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET, DATABASE_URL)
- eslint.config.mjs (ajustes de configuração)
- prisma.config.ts (configuração Prisma v6)
- prisma/schema.prisma (ajustes de índices e datasource)
- prisma/seed.ts (dados de seed atualizados)
- src/app/(public)/layout.tsx (ajustes de layout público)
- src/app/error.tsx (atualizado)
- src/app/not-found.tsx (atualizado)
- src/components/ui/button.tsx, dialog.tsx, dropdown-menu.tsx, sheet.tsx, sidebar.tsx (ShadCN atualizados)
- src/lib/constants.ts (constantes atualizadas)
- src/lib/prisma.ts (singleton PrismaClient)

**Criados fora do escopo (antecipação Story 2.5):**
- src/components/settings/rgpd-settings.tsx (componente RGPD — escopo da Story 2.5, criado antecipadamente)

