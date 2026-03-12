# Story 5.1: Layout Admin & Dashboard de Métricas

Status: ready-for-dev

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

- [ ] Task 1: Adicionar campo `role` ao modelo Prisma e configurar Role enum (AC: #1)
  - [ ] 1.1 Verificar se `enum Role { USER ADMIN }` já existe em `prisma/schema.prisma`
  - [ ] 1.2 Se não existir, adicionar ao schema:
    ```prisma
    enum Role {
      USER
      ADMIN
    }
    ```
    E no model `User`: `role Role @default(USER)`
  - [ ] 1.3 Executar `npx prisma migrate dev --name add-user-role` se alterações necessárias
  - [ ] 1.4 Atualizar seed para criar usuário admin: `prisma/seed.ts` — adicionar `prisma.user.upsert({ where: { email: 'admin@ultra-ia.com' }, create: { email: 'admin@ultra-ia.com', role: 'ADMIN', ... } })`

- [ ] Task 2: Configurar proteção de rotas admin no middleware (AC: #1)
  - [ ] 2.1 Abrir/criar `src/middleware.ts`
  - [ ] 2.2 Adicionar matcher para `/admin/:path*`
  - [ ] 2.3 Verificar `session?.user?.role === 'ADMIN'` para rotas `/admin/*`
  - [ ] 2.4 Se não ADMIN: `return NextResponse.redirect(new URL('/chat', req.url))` (não expor que rota existe)
  - [ ] 2.5 Se não autenticado: `return NextResponse.redirect(new URL('/login?callbackUrl=/admin/dashboard', req.url))`

- [ ] Task 3: Criar tipos admin em `src/types/admin.ts` (AC: #5, #7)
  - [ ] 3.1 Definir `interface PlatformMetrics`:
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
  - [ ] 3.2 Definir `interface AdminNavItem { label: string; href: string; icon: LucideIcon }`

- [ ] Task 4: Criar `src/app/api/admin/analytics/route.ts` — endpoint de métricas (AC: #7, #9)
  - [ ] 4.1 `auth()` → 401 se não autenticado; verificar `session.user.role === 'ADMIN'` → 403 se não admin
  - [ ] 4.2 Implementar função `getAdminMetrics()` envolvida em `unstable_cache`:
    ```typescript
    const getAdminMetrics = unstable_cache(
      async () => { /* queries */ },
      ['admin-metrics'],
      { revalidate: 300, tags: ['analytics'] }
    )
    ```
  - [ ] 4.3 Queries dentro de `getAdminMetrics`:
    - `activeSubscribers`: `prisma.subscription.count({ where: { status: 'ACTIVE' } })`
    - `messagesToday`: `prisma.dailyUsage.aggregate({ _sum: { count: true }, where: { date: getTodayUTC() } })`
    - `mrr`: soma de `Subscription.priceAmount × activeSubscribersCount` (ou via campo `priceAmount` na Subscription se existir)
    - `retentionRate`: `(subscribersEndOfMonth / subscribersStartOfMonth) * 100` — simplificado para MVP: `activeSubscribers / totalUsers * 100`
    - Trend (% de variação): comparar com período anterior via query separada
  - [ ] 4.4 Retornar `{ success: true, data: PlatformMetrics }`
  - [ ] 4.5 Exportar `export const dynamic = 'force-dynamic'` e `export const runtime = 'nodejs'`

- [ ] Task 5: Criar `src/components/dashboard/metrics-card.tsx` — card de métrica (AC: #5, #6)
  - [ ] 5.1 Props: `{ icon: LucideIcon; label: string; value: string | number; trend?: number; prefix?: string; suffix?: string }`
  - [ ] 5.2 Layout: card com ícone top-right, label em cima, valor grande em destaque, trend abaixo (seta verde ↑ se positivo, seta vermelha ↓ se negativo)
  - [ ] 5.3 Componente de trend: `<TrendIndicator trend={trend} />` — `trend > 0` → `text-green-500 ↑ +{trend}%`, `trend < 0` → `text-red-500 ↓ {trend}%`
  - [ ] 5.4 Usar `Card`, `CardContent`, `CardHeader` do ShadCN UI

- [ ] Task 6: Criar `src/components/dashboard/metrics-card-skeleton.tsx` — skeleton (AC: #6)
  - [ ] 6.1 Replicar estrutura do `MetricsCard` com elementos `Skeleton` (de ShadCN) no lugar de valores reais
  - [ ] 6.2 Exportar `MetricsCardSkeleton`

- [ ] Task 7: Criar layout admin `src/app/(admin)/layout.tsx` (AC: #2, #3, #4, #10)
  - [ ] 7.1 Server Component; `auth()` → se não admin, redirecionar (middleware já protege, mas double-check)
  - [ ] 7.2 Sidebar fixa (240px): componente `AdminSidebar` com lista de `AdminNavItem`
  - [ ] 7.3 Nav items: `[{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }, { label: 'Agentes', href: '/admin/agents', icon: Bot }, { label: 'Usuários', href: '/admin/users', icon: Users }, { label: 'Analytics', href: '/admin/analytics', icon: BarChart }, { label: 'Config', href: '/admin/settings', icon: Settings }]`
  - [ ] 7.4 Nav item ativo: Client Component (`AdminSidebarNav`) usando `usePathname()` para destacar item atual (`bg-muted font-medium`)
  - [ ] 7.5 Header admin: logo + "Painel Admin" + link de volta para `/chat`
  - [ ] 7.6 Mobile: sidebar como Sheet (drawer) com botão hamburger no header

- [ ] Task 8: Criar `src/components/admin/admin-sidebar.tsx` — sidebar navegação (AC: #2, #3, #10)
  - [ ] 8.1 Client Component (precisa de `usePathname` para estado ativo)
  - [ ] 8.2 Props: nenhuma (items hardcoded ou via const de `src/lib/admin-nav.ts`)
  - [ ] 8.3 Loop por `adminNavItems`: renderizar Link com ícone + label; aplicar `bg-muted rounded-md` se `pathname.startsWith(item.href)`

- [ ] Task 9: Criar `src/components/admin/breadcrumbs.tsx` — breadcrumbs (AC: #4)
  - [ ] 9.1 Client Component; usar `usePathname()` para derivar breadcrumbs
  - [ ] 9.2 Mapear segmentos de path para labels: `/admin/dashboard` → `["Admin", "Dashboard"]`
  - [ ] 9.3 Usar `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink` do ShadCN UI (se disponível) ou implementar manualmente

- [ ] Task 10: Criar página `src/app/(admin)/dashboard/page.tsx` (AC: #5-#9)
  - [ ] 10.1 Client Component com SWR: `useSWR('/api/admin/analytics', fetcher, { refreshInterval: 300_000 })`
  - [ ] 10.2 Estado de loading: exibir 4 `MetricsCardSkeleton` enquanto `isLoading`
  - [ ] 10.3 Estado de erro: exibir mensagem de erro com botão "Tentar novamente" (`mutate()`)
  - [ ] 10.4 Estado de sucesso: grid 4 colunas (2 em mobile) com `MetricsCard` para cada métrica
  - [ ] 10.5 Botão "Atualizar" no header da página: `onClick={() => mutate()}`
  - [ ] 10.6 Formatação: MRR com `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`; taxa de retenção com `%`

- [ ] Task 11: Adicionar `generateMetadata` e `revalidatePath` (AC: #9)
  - [ ] 11.1 `export const metadata = { title: 'Dashboard | Admin Ultra-IA', robots: { index: false, follow: false } }` no layout admin
  - [ ] 11.2 Criar `src/app/api/admin/revalidate/route.ts` para revalidação manual: `revalidateTag('analytics')` (opcional, para uso futuro)

- [ ] Task 12: Testes e validação (AC: todos)
  - [ ] 12.1 Testar proteção: acessar `/admin/dashboard` com usuário USER → verificar redirect para `/chat`
  - [ ] 12.2 Testar proteção: acessar `/admin/dashboard` sem autenticação → verificar redirect para `/login`
  - [ ] 12.3 Testar layout: sidebar visível, itens corretos, item Dashboard ativo na página dashboard
  - [ ] 12.4 Testar métricas: valores reais exibidos nos MetricsCards
  - [ ] 12.5 Testar skeleton: throttle network → verificar skeletons durante loading
  - [ ] 12.6 Testar responsividade: mobile < 1024px → sidebar como overlay

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

### Completion Notes List

### File List
