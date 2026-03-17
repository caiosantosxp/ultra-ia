# Story: Gestão Completa de Usuários e Experts no Painel Admin

**Status:** Ready for Dev
**Prioridade:** Alta
**Estimativa:** 4 blocos de implementação sequenciais

---

## Contexto

O painel admin já possui leitura de usuários e CRUD de agentes/especialistas. O objetivo desta story é:
1. Tornar o gerenciamento de usuários **completo** (CRUD + roles + soft delete)
2. Adicionar visão cruzada entre usuários e especialistas (assinantes, proprietário)
3. Melhorar a listagem de agentes com informação do proprietário

### Decisões já tomadas
- Role EXPERT = apenas alterar o campo `role` no modelo User, **sem criar Specialist automaticamente**
- Cancelamento de assinatura = processar via Stripe API + atualizar banco local
- Deleção de usuário = **soft delete** — adicionar campo `deletedAt` ao modelo User

---

## Bloco 1 — CRUD Completo de Usuários

### 1.1 — Migração Prisma: soft delete no modelo User

Adicionar campo `deletedAt` ao modelo `User` em `prisma/schema.prisma`:

```prisma
model User {
  // ... campos existentes ...
  deletedAt DateTime? // soft delete
}
```

Rodar: `npx prisma migrate dev --name add_user_soft_delete`

Atualizar todas as queries de listagem de usuários para filtrar `deletedAt: null`.

---

### 1.2 — Server Actions: `src/actions/admin-user-actions.ts`

Criar novo arquivo com as seguintes actions (todas protegidas por `requireAdmin()`):

```typescript
'use server';

// updateUser(userId, { name, email })
// - Validar que email não está em uso por outro usuário
// - Atualizar name e/ou email
// - revalidatePath('/admin/users')
// - revalidatePath(`/admin/users/${userId}`)

// updateUserRole(userId, role: 'USER' | 'EXPERT' | 'ADMIN')
// - RESTRIÇÃO: não pode rebaixar o próprio admin logado
// - RESTRIÇÃO: não pode alterar role de um ADMIN para outro role sem ser super-admin
//   (simplificação: admin pode alterar qualquer role exceto o seu próprio)
// - Se rebaixar de EXPERT para USER: verificar se tem ownedSpecialist
//   → se sim: mostrar erro "Desvincule o especialista antes de alterar o role"
// - revalidatePath('/admin/users')

// softDeleteUser(userId)
// - RESTRIÇÃO: não pode deletar a si mesmo
// - RESTRIÇÃO: não pode deletar um usuário que é EXPERT com ownedSpecialist ativo
//   → se sim: erro "Transfira ou delete o especialista antes de remover o usuário"
// - Setar deletedAt = new Date()
// - Invalidar todas as sessions do usuário (deletar na tabela sessions)
// - revalidatePath('/admin/users')

// createUser(data: { name, email, password, role })
// - Validar email único
// - Hash password com bcrypt
// - Criar user no banco
// - revalidatePath('/admin/users')
```

**Nota sobre cancelamento de assinatura:** Já existe `POST /api/admin/users/[userId]/actions` com `generate-portal-link` e `extend-grace-period`. Adicionar nova action `cancel-subscription` neste endpoint:

```typescript
// Em /api/admin/users/[userId]/actions/route.ts
// Novo case: action === 'cancel-subscription'
// body: { subscriptionId: string }
// - Buscar subscription no banco
// - Chamar stripe.subscriptions.cancel(stripeSubscriptionId)
// - Atualizar status no banco para CANCELED
// - Retornar sucesso
```

---

### 1.3 — Página de Edição: `/admin/users/[userId]/edit/page.tsx`

**Rota:** `src/app/(admin)/admin/users/[userId]/edit/page.tsx`

**Componente server** que busca o usuário e renderiza um form client.

Layout da página:
```
← Voltar para Detalhes do Usuário

[Card] Editar Usuário
  - Input: Nome completo
  - Input: Email (disabled se tem OAuth account vinculada — mostrar aviso)
  - Select: Role (USER | EXPERT | ADMIN)
    → Aviso se mudar para EXPERT: "O usuário precisará vincular um especialista separadamente"
    → Aviso se EXPERT tem especialista e quer rebaixar: erro bloqueante
  - Botão: Salvar alterações (chama updateUser + updateUserRole)

[Card] Zona de Perigo
  - Botão: Deletar usuário
    → AlertDialog com confirmação: "Esta ação marcará o usuário como inativo.
       O histórico de conversas será preservado."
    → Confirmar chama softDeleteUser, redireciona para /admin/users
```

**Criar componente client:** `src/components/admin/user-edit-form.tsx`
- Form com react state para name, email, role
- Submit chama server actions com useTransition
- Toast de sucesso/erro

---

### 1.4 — Atualizar Página de Detalhes: `/admin/users/[userId]/page.tsx`

Modificações no arquivo existente:

1. **Adicionar botão "Editar"** no header do Card de perfil:
```tsx
<Link href={`/admin/users/${user.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
  <Pencil className="mr-2 h-4 w-4" />
  Editar
</Link>
```

2. **Mostrar especialista vinculado** se role === 'EXPERT':
   - Buscar `ownedSpecialist` na query Prisma (adicionar ao select)
   - Mostrar Card: "Especialista vinculado: [nome] → link para /admin/agents/[id]"
   - Se role === 'EXPERT' mas sem especialista: badge "Sem especialista vinculado"

3. **Adicionar cancelamento de assinatura** no `UserDetailCard`:
   - Novo botão "Cancelar assinatura" ao lado dos existentes (apenas se status ACTIVE)
   - AlertDialog de confirmação: "Isso cancelará via Stripe. O acesso permanece até o fim do período atual."
   - Chama `POST /api/admin/users/[userId]/actions` com `{ action: 'cancel-subscription', subscriptionId }`

---

### 1.5 — Atualizar Tabela de Usuários: `UsersTable`

Modificações em `src/components/admin/users-table.tsx`:

1. **Adicionar coluna "Role"** após "Email":
```tsx
<TableHead>Role</TableHead>
// Na row:
<TableCell>
  <Badge variant={user.role === 'ADMIN' ? 'default' : user.role === 'EXPERT' ? 'secondary' : 'outline'}>
    {user.role}
  </Badge>
</TableCell>
```

2. **Adicionar filtro de role** — Select ao lado do Search:
```
[Search input]  [Filtro: Todos | USER | EXPERT | ADMIN]
```
- Passar `role` como query param para `/api/admin/users`
- Atualizar API route para aceitar filtro de role

3. **Indicar usuários soft-deleted** — se vier da API com `deletedAt`, mostrar linha com opacity-50 e badge "Inativo". Incluir toggle "Mostrar inativos" (default: off).

4. **Atualizar API** `/api/admin/users/route.ts`:
   - Adicionar filtro `?role=EXPERT` etc.
   - Adicionar filtro `?includeDeleted=true`
   - Filtrar `deletedAt: null` por padrão

---

## Bloco 2 — Gestão de Experts Aprimorada

### 2.1 — Coluna "Proprietário" na listagem de Agents

Modificar `/admin/agents/page.tsx` e o componente de tabela de agents para incluir:
- Coluna "Proprietário": nome/email do `owner` (User com role EXPERT)
- Link clicável para `/admin/users/[ownerId]`
- Se `ownerId` null: badge "Sem proprietário"

Atualizar API `/api/admin/agents/route.ts` para incluir:
```typescript
include: {
  owner: {
    select: { id: true, name: true, email: true }
  }
}
```

---

### 2.2 — Vincular/Desvincular Proprietário de Especialista

Na página de detalhes do agente (`/admin/agents/[id]`), adicionar seção "Proprietário":

**Server action:** `assignSpecialistOwner(specialistId, userId | null)` em `admin-actions.ts`:
```typescript
// - Verificar que userId tem role EXPERT (ou null para desvincular)
// - Se userId já tem ownedSpecialist diferente: erro bloqueante
// - Atualizar specialist.ownerId
// - revalidatePath
```

**UI na página do agente:**
```
[Card] Proprietário
  - Se tem owner: Avatar + nome + email + link para perfil do usuário
    Botão "Desvincular proprietário"
  - Se não tem owner: "Sem proprietário"
    Botão "Vincular a um usuário EXPERT"
    → Abre um Dialog com busca de usuários (filtrado por role=EXPERT e sem especialista vinculado)
    → Select do usuário + confirmar
```

---

### 2.3 — Transferência de Propriedade

Na mesma seção "Proprietário" do agente (se já tem owner):

Botão "Transferir para outro usuário":
- Dialog com busca de usuários EXPERT sem especialista vinculado
- Confirmar transferência chama `assignSpecialistOwner(specialistId, novoUserId)`
- Aviso: "O usuário anterior perderá o acesso ao painel expert deste especialista"

---

## Bloco 3 — Visão Cruzada Usuário ↔ Expert

### 3.1 — Página de Assinantes do Especialista

**Nova rota:** `src/app/(admin)/admin/agents/[id]/subscribers/page.tsx`

Busca todos os usuários que têm `Subscription` ativa para este especialista:

```typescript
const subscribers = await prisma.subscription.findMany({
  where: { specialistId: id },
  include: {
    user: { select: { id, name, email, role, createdAt } }
  },
  orderBy: { createdAt: 'desc' }
})
```

Layout da página:
```
[h1] Assinantes — [NomeEspecialista]
[Badge] X assinantes ativos

[Table]
  Nome | Email | Status | Desde | Período até | Ações
  ─────────────────────────────────────────────────────
  João  | j@... | ATIVO  | 01/01 | 31/03      | [Ver usuário] [Cancelar]
```

**Adicionar ao menu de navegação do ExpertPanelSidebar** quando em contexto admin:
- Novo item: "Assinantes" com ícone `Users2` apontando para `${base}/subscribers`
- Posicionar entre Analytics e Personalization ou dentro de Monetization

---

### 3.2 — Especialista vinculado na página do usuário

Já coberto no item 1.4 — mostrar o especialista vinculado se role === EXPERT.

---

## Bloco 4 — Melhorias de UX no Dashboard Admin

### 4.1 — Métricas no Dashboard

Atualizar `/admin/dashboard/page.tsx` para incluir métricas reais:

```typescript
const [totalUsers, totalExperts, totalAgents, activeSubscriptions] = await Promise.all([
  prisma.user.count({ where: { deletedAt: null } }),
  prisma.user.count({ where: { role: 'EXPERT', deletedAt: null } }),
  prisma.specialist.count({ where: { isActive: true } }),
  prisma.subscription.count({ where: { status: 'ACTIVE' } }),
])
```

Cards de métricas:
```
[Total Usuários]  [Total Experts]  [Agentes Ativos]  [Assinaturas Ativas]
   1.234              12               8                  456
```

---

## Arquivos a Criar/Modificar

### Novos arquivos:
- `src/actions/admin-user-actions.ts`
- `src/app/(admin)/admin/users/[userId]/edit/page.tsx`
- `src/components/admin/user-edit-form.tsx`
- `src/app/(admin)/admin/agents/[id]/subscribers/page.tsx`

### Arquivos a modificar:
- `prisma/schema.prisma` — adicionar `deletedAt` em User
- `src/actions/admin-actions.ts` — adicionar `assignSpecialistOwner`
- `src/app/api/admin/users/route.ts` — filtros de role + deletedAt
- `src/app/api/admin/users/[userId]/actions/route.ts` — action cancel-subscription
- `src/app/api/admin/agents/route.ts` — incluir owner no select
- `src/app/(admin)/admin/users/[userId]/page.tsx` — botão editar, especialista vinculado
- `src/components/admin/users-table.tsx` — coluna role, filtro, indicador inativo
- `src/components/admin/user-detail-card.tsx` — botão cancelar assinatura
- `src/components/admin/expert-panel-sidebar.tsx` — item Assinantes no nav (admin context)
- `src/app/(admin)/admin/dashboard/page.tsx` — métricas reais

---

## Validações e Restrições de Segurança

| Ação | Restrição |
|---|---|
| Editar email | Bloqueado se tem OAuth account (`accounts.length > 0`) |
| Alterar role para EXPERT | Apenas informativo, sem criar Specialist |
| Rebaixar EXPERT → USER | Bloqueado se tem `ownedSpecialist` ativo |
| Soft delete | Bloqueado se é EXPERT com especialista ativo |
| Soft delete | Admin não pode deletar a si mesmo |
| Alterar próprio role | Admin não pode alterar o próprio role |
| Cancelar assinatura | Processa no Stripe antes de atualizar banco |
| Vincular proprietário | userId deve ter role=EXPERT e não ter outro especialista |

---

## Critérios de Aceite

- [ ] Admin pode editar nome, email e role de qualquer usuário
- [ ] Admin pode soft-delete um usuário (conta marcada como inativa, histórico preservado)
- [ ] Usuários soft-deleted não aparecem na listagem por padrão
- [ ] Admin pode criar usuário manualmente
- [ ] Tabela de usuários tem coluna de role e filtro por role
- [ ] Admin pode cancelar assinatura via Stripe a partir da tela do usuário
- [ ] Página de detalhes do agente mostra proprietário com link para o usuário
- [ ] Admin pode vincular/desvincular/transferir proprietário de um especialista
- [ ] Nova página `/admin/agents/[id]/subscribers` lista todos os assinantes
- [ ] Dashboard admin mostra métricas reais (usuários, experts, agentes, assinaturas)
