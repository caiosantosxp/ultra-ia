# Story 5.1: Layout Admin & Dashboard de Métricas

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como um **admin**,
Quero **acessar um dashboard administrativo com métricas chave da plataforma**,
Para que **possa monitorar a saúde e performance da plataforma de um relance**.

## Acceptance Criteria

1. **[AC1 - Proteção de rota]** Qualquer acesso a `/admin/*` por usuário sem role `ADMIN` é redirecionado para `/chat` com HTTP 403; o middleware valida `session.user.role === 'ADMIN'`
2. **[AC2 - Layout admin]** Admin autenticado acessa `/admin/dashboard` e vê o layout com sidebar fixa (240px) contendo itens: Dashboard, Agentes, Usuários, Analytics, Config
3. **[AC3 - Navegação ativa]** O item da sidebar correspondente à rota atual é destacado visualmente
4. **[AC4 - Breadcrumbs]** Breadcrumbs navegáveis são exibidos no topo da área de conteúdo (ex: "Admin > Dashboard")
5. **[AC5 - MetricsCards]** O dashboard exibe 4 MetricsCards: (1) Assinantes Ativos, (2) Mensagens Hoje, (3) Receita Mensal (MRR), (4) Taxa de Retenção — cada card com ícone, label, valor e trend (seta + %)
6. **[AC6 - Skeleton loading]** Durante o carregamento das métricas, `MetricsCardSkeleton` é exibido nos 4 slots (FR34)
7. **[AC7 - Dados reais]** As métricas refletem dados reais do banco: assinantes via `Subscription.status=ACTIVE`, mensagens via `DailyUsage` de hoje, MRR calculado a partir das assinaturas
8. **[AC8 - Revalidação]** As métricas são revalidadas automaticamente a cada 5 minutos via SWR `refreshInterval: 300_000`; botão "Atualizar" dispara revalidação manual
9. **[AC9 - Caching]** Query de analytics usa `unstable_cache` no servidor com tag `analytics` e revalidação de 5 minutos para evitar sobrecarga no banco
10. **[AC10 - Responsividade]** Sidebar colapsa em overlay no mobile (< 1024px); layout adapta para tela cheia no mobile

## Tasks / Subtasks

- [x] Task 1: Adicionar campo `role` ao modelo Prisma e configurar Role enum (AC: #1)
  - [x] 1.1 Verificar se `enum Role { USER ADMIN }` já existe em `prisma/schema.prisma`
  - [x] 1.2 Se não existir, adicionar ao schema:
    ```prisma
    enum Role {
      USER
      ADMIN
    }
    ```
    E no model `User`: `role Role @default(USER)`
  - [x] 1.3 Executar `npx prisma migrate dev --name add-user-role` se alterações necessárias
  - [x] 1.4 Atualizar seed para criar usuário admin: `prisma/seed.ts` — adicionar `prisma.user.upsert({ where: { email: 'admin@ultra-ia.com' }, create: { email: 'admin@ultra-ia.com', role: 'ADMIN', ... } })`

- [x] Task 2: Configurar proteção de rotas admin no middleware (AC: #1)
  - [x] 2.1 Abrir/criar `src/middleware.ts`
  - [x] 2.2 Adicionar matcher para `/admin/:path*`
  - [x] 2.3 Verificar `session?.user?.role === 'ADMIN'` para rotas `/admin/*`
  - [x] 2.4 Se não ADMIN: `return NextResponse.redirect(new URL('/chat', req.url))` (não expor que rota existe)
  - [x] 2.5 Se não autenticado: `return NextResponse.redirect(new URL('/login?callbackUrl=/admin/dashboard', req.url))`

- [x] Task 3: Criar tipos admin em `src/types/admin.ts` (AC: #5, #7)
  - [x] 3.1 Definir `interface PlatformMetrics`:
    ```typescript
    interface PlatformMetrics {
      activeSubscribers: number
      activeSubscribersTrend: number  // % vs mês anterior
      messagesToday: number
      messagesTodayTrend: number      // % vs ontem
      mrr: number                     // Receita Mensal Recorrente em cents
      mrrTrend: number                // % vs mês anterior
      retentionRate: number           // 0-100
      retentionRateTrend: number
    }
    ```
  - [x] 3.2 Definir `interface AdminNavItem { label: string; href: string; icon: LucideIcon }`

- [x] Task 4: Criar `src/app/api/admin/analytics/route.ts` — endpoint de métricas (AC: #7, #9)
  - [x] 4.1 `auth()` → 401 se não autenticado; verificar `session.user.role === 'ADMIN'` → 403 se não admin
  - [x] 4.2 Implementar função `getAdminMetrics()` envolvida em `unstable_cache`:
    ```typescript
    const getAdminMetrics = unstable_cache(
      async () => { /* queries */ },
      ['admin-metrics'],
      { revalidate: 300, tags: ['analytics'] }
    )
    ```
  - [x] 4.3 Queries dentro de `getAdminMetrics`:
    - `activeSubscribers`: `prisma.subscription.count({ where: { status: 'ACTIVE' } })`
    - `messagesToday`: `prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: getTodayUTC() } })`
    - `mrr`: soma de `Subscription.priceAmount × activeSubscribersCount` (ou via campo `priceAmount` na Subscription se existir)
    - `retentionRate`: `(subscribersEndOfMonth / subscribersStartOfMonth) * 100` — simplificado para MVP: `activeSubscribers / totalUsers * 100`
    - Trend (% de variação): comparar com período anterior via query separada
  - [x] 4.4 Retornar `{ success: true, data: PlatformMetrics }`
  - [x] 4.5 Exportar `export const dynamic = 'force-dynamic'` e `export const runtime = 'nodejs'`

- [x] Task 5: Criar `src/components/dashboard/metrics-card.tsx` — card de métrica (AC: #5, #6)
  - [x] 5.1 Props: `{ icon: LucideIcon; label: string; value: string | number; trend?: number; prefix?: string; suffix?: string }`
  - [x] 5.2 Layout: card com ícone top-right, label em cima, valor grande em destaque, trend abaixo (seta verde ↑ se positivo, seta vermelha ↓ se negativo)
  - [x] 5.3 Componente de trend: `<TrendIndicator trend={trend} />` — `trend > 0` → `text-green-500 ↑ +{trend}%`, `trend < 0` → `text-red-500 ↓ {trend}%`
  - [x] 5.4 Usar `Card`, `CardContent`, `CardHeader` do ShadCN UI

- [x] Task 6: Criar `src/components/dashboard/metrics-card-skeleton.tsx` — skeleton (AC: #6)
  - [x] 6.1 Replicar estrutura do `MetricsCard` com elementos `Skeleton` (de ShadCN) no lugar de valores reais
  - [x] 6.2 Exportar `MetricsCardSkeleton`

- [x] Task 7: Criar layout admin `src/app/(admin)/layout.tsx` (AC: #2, #3, #4, #10)
  - [x] 7.1 Server Component; `auth()` → se não admin, redirecionar (middleware já protege, mas double-check)
  - [x] 7.2 Sidebar fixa (240px): componente `AdminSidebar` com lista de `AdminNavItem`
  - [x] 7.3 Nav items: `[{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }, { label: 'Agentes', href: '/admin/agents', icon: Bot }, { label: 'Usuários', href: '/admin/users', icon: Users }, { label: 'Analytics', href: '/admin/analytics', icon: BarChart }, { label: 'Config', href: '/admin/settings', icon: Settings }]`
  - [x] 7.4 Nav item ativo: Client Component (`AdminSidebarNav`) usando `usePathname()` para destacar item atual (`bg-muted font-medium`)
  - [x] 7.5 Header admin: logo + "Painel Admin" + link de volta para `/chat`
  - [x] 7.6 Mobile: sidebar como Sheet (drawer) com botão hamburger no header

- [x] Task 8: Criar `src/components/admin/admin-sidebar.tsx` — sidebar navegação (AC: #2, #3, #10)
  - [x] 8.1 Client Component (precisa de `usePathname` para estado ativo)
  - [x] 8.2 Props: nenhuma (items hardcoded ou via const de `src/lib/admin-nav.ts`)
  - [x] 8.3 Loop por `adminNavItems`: renderizar Link com ícone + label; aplicar `bg-muted rounded-md` se `pathname.startsWith(item.href)`

- [x] Task 9: Criar `src/components/admin/breadcrumbs.tsx` — breadcrumbs (AC: #4)
  - [x] 9.1 Client Component; usar `usePathname()` para derivar breadcrumbs
  - [x] 9.2 Mapear segmentos de path para labels: `/admin/dashboard` → `["Admin", "Dashboard"]`
  - [x] 9.3 Usar `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink` do ShadCN UI (se disponível) ou implementar manualmente

- [x] Task 10: Criar página `src/app/(admin)/dashboard/page.tsx` (AC: #5-#9)
  - [x] 10.1 Client Component com SWR: `useSWR('/api/admin/analytics', fetcher, { refreshInterval: 300_000 })`
  - [x] 10.2 Estado de loading: exibir 4 `MetricsCardSkeleton` enquanto `isLoading`
  - [x] 10.3 Estado de erro: exibir mensagem de erro com botão "Tentar novamente" (`mutate()`)
  - [x] 10.4 Estado de sucesso: grid 4 colunas (2 em mobile) com `MetricsCard` para cada métrica
  - [x] 10.5 Botão "Atualizar" no header da página: `onClick={() => mutate()}`
  - [x] 10.6 Formatação: MRR com `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`; taxa de retenção com `%`

- [x] Task 11: Adicionar `generateMetadata` e `revalidatePath` (AC: #9)
  - [x] 11.1 `export const metadata = { title: 'Dashboard | Admin Ultra-IA', robots: { index: false, follow: false } }` no layout admin
  - [x] 11.2 Criar `src/app/api/admin/revalidate/route.ts` para revalidação manual: `revalidateTag('analytics')` (opcional, para uso futuro)

- [x] Task 12: Testes e validação (AC: todos)
  - [x] 12.1 Testar proteção: acessar `/admin/dashboard` com usuário USER → verificar redirect para `/chat`
  - [x] 12.2 Testar proteção: acessar `/admin/dashboard` sem autenticação → verificar redirect para `/login`
  - [x] 12.3 Testar layout: sidebar visível, itens corretos, item Dashboard ativo na página dashboard
  - [x] 12.4 Testar métricas: valores reais exibidos nos MetricsCards
  - [x] 12.5 Testar skeleton: throttle network → verificar skeletons durante loading
  - [x] 12.6 Testar responsividade: mobile < 1024px → sidebar como overlay

## Dev Notes

### Proteção de Rotas Admin: Middleware + Double-Check

**Abordagem em duas camadas:**

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Proteção rotas admin
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
    }
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
  }

  // Proteção rotas dashboard (autenticação apenas)
  if (pathname.startsWith('/chat') || pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
})

export const config = {
  matcher: ['/admin/:path*', '/chat/:path*', '/dashboard/:path*'],
}
```

**Double-check em Server Components/API Routes:**
```typescript
// Em API routes admin:
const session = await auth()
if (!session) return Response.json({ ... }, { status: 401 })
if (session.user.role !== 'ADMIN') return Response.json({ ... }, { status: 403 })
```

### Role no Prisma + Auth.js Session

Para que `session.user.role` funcione, o campo `role` deve ser incluído na sessão pelo Auth.js:

```typescript
// src/lib/auth.ts (callbacks)
callbacks: {
  session({ session, user }) {
    if (session.user && user) {
      session.user.id = user.id
      session.user.role = user.role  // Incluir role na sessão
    }
    return session
  }
}
```

E extender o tipo `Session` via `next-auth.d.ts`:
```typescript
// src/types/next-auth.d.ts
import { Role } from '@prisma/client'
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      // ... outros campos
    }
  }
}
```

### Queries de Métricas com `unstable_cache`

```typescript
// src/app/api/admin/analytics/route.ts
import { unstable_cache } from 'next/cache'

const getAdminMetrics = unstable_cache(
  async (): Promise<PlatformMetrics> => {
    const today = new Date().toISOString().split('T')[0]
    const firstDayThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const firstDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    const [
      activeSubscribers,
      lastMonthSubscribers,
      messagesTodayResult,
      messagesYesterdayResult,
      totalUsers,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({
        where: { status: 'ACTIVE', createdAt: { gte: firstDayLastMonth, lt: firstDayThisMonth } }
      }),
      prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: today } }),
      prisma.dailyUsage.aggregate({
        _sum: { count: true },
        where: { date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
      }),
      prisma.user.count({ where: { role: 'USER' } }),
    ])

    const messagesToday = messagesTodayResult._sum.count ?? 0
    const messagesYesterday = messagesYesterdayResult._sum.count ?? 0

    // MRR simplificado: activeSubscribers × preço médio da assinatura
    // Ajustar conforme modelo de preços da plataforma
    const MRR_PER_SUBSCRIBER_CENTS = 2900 // €29/mês (exemplo)
    const mrr = activeSubscribers * MRR_PER_SUBSCRIBER_CENTS

    return {
      activeSubscribers,
      activeSubscribersTrend: lastMonthSubscribers
        ? Math.round(((activeSubscribers - lastMonthSubscribers) / lastMonthSubscribers) * 100)
        : 0,
      messagesToday,
      messagesTodayTrend: messagesYesterday
        ? Math.round(((messagesToday - messagesYesterday) / messagesYesterday) * 100)
        : 0,
      mrr,
      mrrTrend: 0, // Calcular com dados históricos se disponíveis
      retentionRate: totalUsers > 0 ? Math.round((activeSubscribers / totalUsers) * 100) : 0,
      retentionRateTrend: 0,
    }
  },
  ['admin-metrics'],
  { revalidate: 300, tags: ['analytics'] }
)
```

### Estrutura do Layout Admin

```
src/app/(admin)/
├── layout.tsx                    # Layout raiz admin (sidebar + header)
├── dashboard/
│   └── page.tsx                  # Dashboard com MetricsCards
├── agents/                       # Story 5.2
│   └── page.tsx
├── users/                        # Story 5.3
│   └── page.tsx
├── analytics/                    # Story 5.4
│   └── page.tsx
└── settings/                     # Futuro
    └── page.tsx
```

### AdminSidebar: Client Component para Estado Ativo

O layout admin deve ser Server Component, mas a sidebar precisa de `usePathname()` (client):
```typescript
// src/app/(admin)/layout.tsx — Server Component
export default async function AdminLayout({ children }) {
  const session = await auth()
  // double-check role

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />  {/* Client Component */}
      <main className="flex-1 p-6">
        <Breadcrumbs />
        {children}
      </main>
    </div>
  )
}

// src/components/admin/admin-sidebar.tsx — 'use client'
export function AdminSidebar() {
  const pathname = usePathname()
  // ...
}
```

### MetricsCard Layout

```typescript
// src/components/dashboard/metrics-card.tsx
interface MetricsCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: number
  description?: string
}

export function MetricsCard({ icon: Icon, label, value, trend, description }: MetricsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={cn('text-xs mt-1', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs período anterior
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
```

### Estrutura de Arquivos

**Novos arquivos:**
- `prisma/schema.prisma` — adicionar enum Role + campo role em User (se ausente)
- `src/types/next-auth.d.ts` — extensão do tipo Session
- `src/types/admin.ts` — PlatformMetrics, AdminNavItem
- `src/middleware.ts` — proteção rotas admin (ou atualizar se já existir)
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/dashboard/page.tsx`
- `src/app/api/admin/analytics/route.ts`
- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/breadcrumbs.tsx`
- `src/components/dashboard/metrics-card.tsx`
- `src/components/dashboard/metrics-card-skeleton.tsx`
- `src/lib/admin-nav.ts` — constante com itens de navegação

**Arquivos a modificar:**
- `src/lib/auth.ts` — adicionar `role` no callback `session`
- `prisma/seed.ts` — adicionar usuário admin
- `package.json` — nenhuma dependência nova necessária para esta story

### Project Structure Notes

Alinhamento com arquitetura ([Source: architecture.md#Complete Project Directory Structure]):
- `src/app/(admin)/layout.tsx` ✓
- `src/app/(admin)/dashboard/page.tsx` ✓
- `src/app/api/admin/analytics/route.ts` ✓
- `src/components/admin/` ✓
- `src/components/dashboard/metrics-card.tsx` ✓
- `src/types/admin.ts` ✓
- `unstable_cache` para queries frequentes de analytics ✓
- SWR no cliente para revalidação automática ✓

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — Authorization Middleware + Role Check]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure — (admin)]
- [Source: _bmad-output/planning-artifacts/architecture.md#Caching — unstable_cache para métricas dashboard]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Boundaries — /api/admin/* Admin only]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries — components/admin/ SWR + Server Actions]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1: Layout Admin & Dashboard de Métricas]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `revalidateTag` em Next.js 16 requer 2 argumentos (novo `"use cache"` API); usou `revalidatePath` na rota de revalidação manual
- `SheetTrigger` de base-ui usa `render` prop em vez de `asChild` (padrão Radix UI não aplicável)
- Arquivos existentes (schema, middleware, auth.ts, types/admin.ts, types/next-auth.d.ts) já tinham implementações corretas de Stories anteriores
- Métricas de plataforma adicionadas como handler `?type=platform` na rota analytics existente (preserva compatibilidade Story 5.4)
- 0 erros TypeScript nos novos arquivos (18 erros pré-existentes de Stories 5.2/5.3/5.4)

### Completion Notes List

- ✅ Task 1: enum Role + User.role já existiam no schema. Migração não necessária. Admin seed adicionado (`admin@ultra-ia.com`, role: ADMIN, senha bcrypt).
- ✅ Task 2: middleware.ts já existia com proteção admin correta.
- ✅ Task 3: src/types/admin.ts e src/types/next-auth.d.ts já existiam com tipos corretos.
- ✅ Task 4: Adicionados `getPlatformMetrics` e handler `?type=platform` na rota analytics existente (Story 5.4 preservada).
- ✅ Task 5: MetricsCard atualizado com TrendIndicator numérico (↑ verde / ↓ vermelho), props prefix/suffix, backward-compatible.
- ✅ Task 6: MetricsCardSkeleton criado como componente separado.
- ✅ Task 7: Layout admin atualizado com sidebar desktop (lg:flex) + mobile Sheet + Breadcrumbs + metadata correto.
- ✅ Task 8: AdminSidebar refatorado com adminNavItems de lib/admin-nav.ts + mobile Sheet (render prop base-ui).
- ✅ Task 9: Breadcrumbs criado com mapeamento de segmentos para labels em Português.
- ✅ Task 10: Dashboard page com SWR (`?type=platform`), 4 MetricsCards, skeleton loading, error state, botão Atualizar.
- ✅ Task 11: Metadata no layout. Revalidate route com revalidatePath.

### File List

**Modificados:**
- `prisma/seed.ts`
- `src/app/(admin)/layout.tsx`
- `src/components/dashboard/metrics-card.tsx`
- `src/app/api/admin/analytics/route.ts`
- `src/app/api/admin/revalidate/route.ts`

**Criados:**
- `src/lib/admin-nav.ts`
- `src/components/admin/admin-sidebar.tsx`
- `src/components/admin/breadcrumbs.tsx`
- `src/components/dashboard/metrics-card-skeleton.tsx`
- `src/app/(admin)/dashboard/page.tsx`

### Change Log

- 2026-03-12: Story 5.1 implementada — layout admin com sidebar responsiva (desktop+mobile Sheet), proteção de rotas (middleware+double-check), breadcrumbs, dashboard com 4 MetricsCards (dados reais via unstable_cache + SWR refreshInterval 5min), skeleton loading, TrendIndicator colorido.
- 2026-03-12: Code review (AI) — 4 High + 4 Medium corrigidos: (1) exports `force-dynamic`/`runtime` adicionados à rota analytics; (2) cálculo `activeSubscribersTrend` corrigido (era count de criados no mês, agora compara total atual vs pré-existentes); (3) MRR agora usa `specialist.price` real via `findMany` em vez de constante hardcoded; (4) MRR trend implementado; (5) `revalidateTag('analytics')` substituiu `revalidatePath` na rota de revalidação; (6) Sheet mobile agora usa state controlado e fecha ao navegar; (7) sidebar desktop usa `sticky top-0 h-screen overflow-y-auto`; (8) senha admin do seed lê `ADMIN_SEED_PASSWORD` do env. File List corrigido: admin-sidebar.tsx é arquivo Criado, não Modificado.
