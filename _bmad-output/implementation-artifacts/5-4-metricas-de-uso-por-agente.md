# Story 5.4: Métricas de Uso por Agente

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **admin**,
I want **to view usage metrics per specialist agent**,
so that **I can evaluate agent performance and make data-driven decisions**.

## Acceptance Criteria

1. **Given** um admin acessa `/admin/analytics` **When** a página carrega **Then** uma tabela comparativa exibe todos os agentes com métricas chave: total de mensagens, assinantes ativos, conversas totais, taxa de retenção aproximada

2. **Given** um admin seleciona um agente específico **When** a seção de detalhes é exibida **Then** métricas detalhadas são mostradas: total de mensagens, média mensagens/dia, assinantes ativos, taxa de retenção, conversas/semana (FR38)

3. **Given** um admin quer analisar tendências **When** seleciona um período (7 dias, 30 dias, 90 dias) via Tabs **Then** os gráficos e métricas se atualizam para o período selecionado sem recarregar a página

4. **And** gráfico de linha exibe mensagens por dia ao longo do período selecionado (usando ShadCN Chart / Recharts)

5. **And** queries agregadas são otimizadas utilizando índices existentes em `createdAt`, `specialistId`, e `conversationId` no schema Prisma

6. **And** dados das métricas são cacheados via `unstable_cache` com revalidação de 5 minutos (300 segundos) para reduzir carga no banco

7. **And** loading skeletons são exibidos durante carregamento de dados (Skeleton component do ShadCN)

8. **And** API `GET /api/admin/analytics?specialistId=&period=30` estende a route existente com suporte a filtros opcionais

9. **And** todas as APIs `/api/admin/*` verificam `session.user.role === 'ADMIN'` — retornam 403 FORBIDDEN se role diferente

## Tasks / Subtasks

- [ ] Task 1: Instalar ShadCN Chart (Recharts) (AC: #4)
  - [ ] 1.1 Verificar se ShadCN Chart está instalado:
    ```bash
    ls src/components/ui/ | grep chart
    ```
  - [ ] 1.2 Se não instalado, instalar:
    ```bash
    npx shadcn@latest add chart
    # Instala: src/components/ui/chart.tsx + dependência recharts
    ```
  - [ ] 1.3 Verificar que `recharts` aparece em `package.json` após instalação

- [ ] Task 2: Estender API de Analytics com suporte a filtros por agente e período (AC: #5, #6, #8, #9)
  - [ ] 2.1 Atualizar `src/app/api/admin/analytics/route.ts` (criado na Story 5.1 para métricas gerais):
    - Adicionar suporte a query params: `?specialistId=&period=30` (period em dias: 7, 30, 90)
    - Estrutura:
      ```typescript
      const specialistId = searchParams.get('specialistId') ?? null;
      const period = Math.min(90, Math.max(7, parseInt(searchParams.get('period') ?? '30')));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);
      ```
    - Com filtro por `specialistId` + período:
      - Calcular `totalMessages`: `prisma.message.count({ where: { conversation: { specialistId }, createdAt: { gte: startDate } } })`
      - Calcular `activeSubscribers`: `prisma.subscription.count({ where: { specialistId, status: 'ACTIVE' } })`
      - Calcular `totalConversations`: `prisma.conversation.count({ where: { specialistId, createdAt: { gte: startDate }, isDeleted: false } })`
      - Calcular `retentionRate`: `(activeSubscribers / totalSubscribersAllTime) * 100` arredondado
      - Calcular `messagesPerDay`: `totalMessages / period`
      - Calcular `conversationsPerWeek`: `totalConversations / (period / 7)`
    - Calcular `dailyMessageData` para gráfico (array de {date, count}) via `$queryRaw`:
      ```typescript
      const dailyData = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT
          DATE(m.created_at) as date,
          COUNT(m.id)::int as count
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.specialist_id = ${specialistId}
          AND m.created_at >= ${startDate}
          AND c.is_deleted = false
        GROUP BY DATE(m.created_at)
        ORDER BY date ASC
      `;
      ```
    - **Se** `specialistId` não fornecido: retornar métricas gerais agregadas (para tabela comparativa)

  - [ ] 2.2 Envolver as queries em `unstable_cache`:
    ```typescript
    import { unstable_cache } from 'next/cache';

    const getAgentMetrics = unstable_cache(
      async (specialistId: string, period: number) => {
        // ... todas as queries Prisma acima
        return { totalMessages, activeSubscribers, ... };
      },
      ['agent-metrics'],
      { revalidate: 300, tags: [`agent-${specialistId}-metrics`] }
    );

    // Usar na route:
    const metrics = await getAgentMetrics(specialistId, period);
    ```

  - [ ] 2.3 Para tabela comparativa (sem `specialistId`):
    - Buscar todos os especialistas ativos
    - Para cada um, calcular métricas resumidas (sem daily chart data)
    - Usar `Promise.all()` para queries paralelas (não sequenciais):
      ```typescript
      const specialists = await prisma.specialist.findMany({ where: { isActive: true } });
      const metricsPerSpecialist = await Promise.all(
        specialists.map(async (specialist) => {
          const [totalMessages, activeSubscribers, totalConversations] = await Promise.all([
            prisma.message.count({ where: { conversation: { specialistId: specialist.id, isDeleted: false } } }),
            prisma.subscription.count({ where: { specialistId: specialist.id, status: 'ACTIVE' } }),
            prisma.conversation.count({ where: { specialistId: specialist.id, isDeleted: false } }),
          ]);
          return { specialist, totalMessages, activeSubscribers, totalConversations };
        })
      );
      ```
    - **CUIDADO com N+1**: `Promise.all()` é obrigatório para evitar queries sequenciais

- [ ] Task 3: Criar componente AnalyticsChart (AC: #4, #7)
  - [ ] 3.1 Criar `src/components/admin/analytics-chart.tsx` como Client Component (`'use client'`):
    - Import: `ChartContainer`, `ChartTooltip`, `LineChart`, `Line`, `XAxis`, `YAxis` de ShadCN Chart / Recharts
    - Props: `data: Array<{ date: string; count: number }>`, `isLoading?: boolean`
    - Loading state: mostrar `<Skeleton className="h-64 w-full" />` quando `isLoading`
    - Gráfico de linha simples (mensagens por dia):
      ```typescript
      const chartConfig = {
        count: {
          label: 'Messages',
          color: 'hsl(var(--primary))',
        },
      };

      return (
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart data={data}>
            <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'd MMM', { locale: fr })} />
            <YAxis />
            <ChartTooltip />
            <Line type="monotone" dataKey="count" stroke="var(--color-count)" dot={false} />
          </LineChart>
        </ChartContainer>
      );
      ```
    - Empty state: se `data.length === 0`, mostrar "Aucune donnée pour cette période"

  - [ ] 3.2 Layout do gráfico:
    ```
    ┌──────────────────────────────────────────────────────────┐
    │  Messages par jour  (30 derniers jours)                  │
    │                                                          │
    │  ▲                                                       │
    │  │         ·····                                         │
    │  │    ····      ·····                                    │
    │  │  ··               ····                                │
    │  │ ·                     ·····                           │
    │  └──────────────────────────────────────────────────→    │
    │    1 fév  8 fév  15 fév  22 fév  1 mars                  │
    └──────────────────────────────────────────────────────────┘
    ```

- [ ] Task 4: Criar página de Analytics detalhada (AC: #1, #2, #3, #7)
  - [ ] 4.1 Atualizar/criar `src/app/(admin)/analytics/page.tsx` (pode já existir da Story 5.1 com métricas gerais):
    - **SE a página já existe** (Story 5.1): adicionar nova seção "Métriques par agent" abaixo das métricas gerais
    - **SE não existe**: criar do zero como Server Component
    - `generateMetadata()`: title "Analytics — Admin"
    - Buscar lista de especialistas ativos para o seletor
    - Buscar métricas comparativas via `unstable_cache`

  - [ ] 4.2 Estrutura da página:
    ```
    ┌────────────────────────────────────────────────────────────┐
    │  Analytics                                                  │
    │                                                            │
    │  ┌── Tableau comparatif ───────────────────────────────┐  │
    │  │ Agente          | Msgs (total) | Abonnés | Conv.    │  │
    │  │ Avocat d'Affaires│    1,234    │    42   │  87      │  │
    │  │ Expert Comptable │      567    │    19   │  34      │  │
    │  └────────────────────────────────────────────────────┘  │
    │                                                            │
    │  ── Détails par agent ──────────────────────────────────  │
    │                                                            │
    │  [Sélectionner un agent ▾]  [7j] [30j] [90j]  ← Tabs    │
    │                                                            │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
    │  │ 1,234   │  │ 41.1/j  │  │   42    │  │  87%    │     │
    │  │ Messages│  │ Msgs/j  │  │ Abonnés │  │Rétention│     │
    │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
    │                                                            │
    │  ┌── Messages par jour (Recharts LineChart) ───────────┐  │
    │  │  [gráfico de linha]                                  │  │
    │  └────────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────────┘
    ```

  - [ ] 4.3 Seleção de agente + período como Client Component (`'use client'`):
    - Criar `src/components/admin/agent-analytics-panel.tsx`:
      - Estado: `selectedSpecialistId: string | null`, `period: 7 | 30 | 90`
      - Seletor de agente: `<Select>` do ShadCN com lista de especialistas (prop do Server Component)
      - Tabs de período: `<Tabs>` com valores "7", "30", "90"
      - SWR para buscar métricas quando `selectedSpecialistId` + `period` mudarem:
        ```typescript
        const { data, isLoading } = useSWR(
          selectedSpecialistId
            ? `/api/admin/analytics?specialistId=${selectedSpecialistId}&period=${period}`
            : null,
          fetcher
        );
        ```
      - Renderizar `<MetricsCard />` (da Story 5.1) para cada métrica
      - Renderizar `<AnalyticsChart />` com dados `data?.dailyData`

- [ ] Task 5: Criar/Verificar MetricsCard do Story 5.1 (AC: #2, #7)
  - [ ] 5.1 Verificar `src/components/dashboard/metrics-card.tsx` (criado na Story 5.1):
    - Deve aceitar props: `icon`, `label`, `value`, `trend`, `isLoading`
    - Se `isLoading === true`: renderizar Skeleton ao invés dos dados
    - **SE** MetricsCard apenas existe para o dashboard geral: verificar se pode ser reutilizado aqui com as mesmas props
  - [ ] 5.2 Se necessário adaptar MetricsCard para uso no painel de analytics por agente:
    - Adicionar prop opcional `description?: string` para contexto adicional (ex: "sur les 30 derniers jours")

- [ ] Task 6: Validação final (AC: todos)
  - [ ] 6.1 `npm run lint` sem erros
  - [ ] 6.2 `npx tsc --noEmit` sem erros TypeScript
  - [ ] 6.3 Testar `/admin/analytics`: tabela comparativa carrega com todos os agentes
  - [ ] 6.4 Testar seleção de agente: métricas detalhadas do agente aparecem
  - [ ] 6.5 Testar seleção de período (7/30/90 dias): métricas e gráfico atualizam
  - [ ] 6.6 Testar loading states: Skeletons aparecem durante fetch
  - [ ] 6.7 Verificar que `unstable_cache` está cacheando (segunda request < 100ms)
  - [ ] 6.8 Testar proteção admin: usuário USER tentando acessar → redirect
  - [ ] 6.9 Verificar índices Prisma: queries de analytics devem usar índices em `specialistId`, `createdAt`
  - [ ] 6.10 Verificar dark mode no gráfico (cores via CSS custom properties)

## Dev Notes

### Pré-requisitos das Stories Anteriores

Esta story depende das Stories 5.1, 5.2, 5.3 (e toda Epic 2/3 base):

**Da Story 5.1 (Admin Dashboard):**
- `src/app/(admin)/analytics/page.tsx` — **PODE já existir** com métricas gerais — verificar e estender
- `src/app/api/admin/analytics/route.ts` — **JÁ EXISTE** — estender com `?specialistId=&period=`
- `src/components/dashboard/metrics-card.tsx` — MetricsCard com props: icon, label, value, trend, isLoading
- SWR instalado, admin layout com sidebar, middleware de ADMIN check

**Da Story 5.2 (Gestão de Agentes):**
- Specialists com campos: id, name, domain, slug, isActive, accentColor

**Da Story 5.3 (Gestão de Usuários):**
- `src/app/api/admin/users/route.ts` — padrões de autorização admin estabelecidos

### Estado Atual do Codebase (Analytics Related)

| Componente | Status | Ação Nesta Story |
|---|---|---|
| `src/app/(admin)/analytics/page.tsx` | Criado na Story 5.1 (métricas gerais) | Estender com per-specialist analytics |
| `src/app/api/admin/analytics/route.ts` | Criado na Story 5.1 | Estender com ?specialistId= e ?period= |
| `src/components/admin/analytics-chart.tsx` | Não existe | Criar componente de gráfico de linha |
| `src/components/admin/agent-analytics-panel.tsx` | Não existe | Criar Client Component com seletor + SWR |
| `src/components/ui/chart.tsx` | Verificar — provavelmente não instalado | `npx shadcn@latest add chart` |

### `unstable_cache` — Padrão Obrigatório da Arquitetura

```typescript
import { unstable_cache } from 'next/cache';

// Analytics é caro — cache de 5 minutos
const getCachedAgentMetrics = unstable_cache(
  async (specialistId: string, period: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const [totalMessages, activeSubscribers, totalSubscribersAllTime, totalConversations] =
      await Promise.all([
        prisma.message.count({
          where: {
            conversation: { specialistId, isDeleted: false },
            createdAt: { gte: startDate },
          },
        }),
        prisma.subscription.count({
          where: { specialistId, status: 'ACTIVE' },
        }),
        prisma.subscription.count({
          where: { specialistId },
        }),
        prisma.conversation.count({
          where: { specialistId, isDeleted: false, createdAt: { gte: startDate } },
        }),
      ]);

    const retentionRate =
      totalSubscribersAllTime > 0
        ? Math.round((activeSubscribers / totalSubscribersAllTime) * 100)
        : 0;
    const messagesPerDay = totalMessages > 0 ? (totalMessages / period).toFixed(1) : '0';
    const conversationsPerWeek = totalConversations > 0 ? (totalConversations / (period / 7)).toFixed(1) : '0';

    return {
      totalMessages,
      activeSubscribers,
      retentionRate,
      messagesPerDay,
      conversationsPerWeek,
    };
  },
  // Cache key inclui specialistId e period para granularidade
  ['agent-metrics'],
  {
    revalidate: 300, // 5 minutos
    tags: ['analytics'], // Para revalidação manual via revalidateTag('analytics')
  }
);
```

**Nota**: `unstable_cache` da Next.js 15+ requer que os argumentos sejam serializáveis (strings, números, etc.) — não passar objetos Prisma ou funções.

### Queries com `$queryRaw` para Time-Series

Para dados diários (necessários para o gráfico de linha), Prisma `groupBy` não suporta truncamento de data nativamente. Usar `$queryRaw` com SQL nativo:

```typescript
// Atenção: snake_case no SQL ($queryRaw usa SQL puro, não Prisma naming)
const dailyData = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
  SELECT
    DATE(m.created_at) AS date,
    COUNT(m.id)::int AS count
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.specialist_id = ${specialistId}
    AND m.created_at >= ${startDate}
    AND c.is_deleted = false
  GROUP BY DATE(m.created_at)
  ORDER BY date ASC
`;
```

**IMPORTANTE**: No schema Prisma, a coluna é `created_at` (snake_case DB via `@@map`) mas no modelo Prisma é `createdAt`. No `$queryRaw`, usar nomes das colunas do DB (snake_case). Verificar o `@@map` de cada modelo.

**Verificar nomes de colunas DB:**
```prisma
// schema.prisma
model Message {
  createdAt     DateTime @default(now()) // → coluna DB: created_at
  conversationId String                  // → coluna DB: conversation_id
  @@map("messages")
}

model Conversation {
  specialistId  String                  // → coluna DB: specialist_id
  isDeleted     Boolean @default(false) // → coluna DB: is_deleted
  @@map("conversations")
}
```

### Índices Prisma — Queries de Analytics

Os índices já definidos no schema são suficientes para as queries desta story:

```prisma
model Conversation {
  @@index([userId, createdAt])    // Usado em: WHERE userId + ORDER BY createdAt
  @@index([specialistId])         // Usado em: WHERE specialistId (analytics)
}

model Message {
  @@index([conversationId, createdAt])  // Usado em: JOIN conversations + ORDER BY createdAt
}

model Subscription {
  @@index([userId])               // Usado em: WHERE userId
  @@index([stripeSubscriptionId]) // Usado em: Stripe sync
  @@unique([userId, specialistId]) // Usado em: deduplicação
}
```

**Query de analytics por especialista já utiliza estes índices** — não são necessários índices adicionais para MVP.

### ShadCN Chart — Instalação e Uso

ShadCN Chart é um wrapper sobre Recharts com tokens de design integrados:

```bash
npx shadcn@latest add chart
```

Isso instala:
- `src/components/ui/chart.tsx` — ChartContainer, ChartTooltip, ChartTooltipContent
- `recharts` como dependência npm

**Padrão de uso básico (Line Chart):**
```typescript
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';

const chartConfig: ChartConfig = {
  count: { label: 'Messages', color: 'hsl(var(--primary))' },
};

export function AnalyticsChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <ChartContainer config={chartConfig} className="h-64">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: fr })}
          className="text-xs text-muted-foreground"
        />
        <YAxis className="text-xs text-muted-foreground" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
```

### Cálculo de Retenção (Taxa de Retenção Aproximada)

Para MVP, taxa de retenção = `(assinantes ativos) / (total de assinantes de todos os tempos) * 100`:

```typescript
const retentionRate = totalSubscribersAllTime > 0
  ? Math.round((activeSubscribers / totalSubscribersAllTime) * 100)
  : 0;
// Exemplo: 42 ativos / 50 históricos = 84% de retenção
```

**Limitação conhecida**: Esta é uma aproximação, não a taxa de retenção real por cohort. Para retenção real:
- Cohort analysis: usuários que assinaram há X meses e ainda estão ativos
- Implementação futura mais sofisticada via queries por período de início de assinatura

### Padrão de Autorização Admin (mesmo da Story 5.3)

Todos os route handlers `/api/admin/*` devem incluir:
```typescript
const session = await auth();
if (!session?.user?.id) return Response.json({ ... }, { status: 401 });
if (session.user.role !== 'ADMIN') return Response.json({ ... }, { status: 403 });
```

### Seletor de Agente — Componente ShadCN Select

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Verificar se Select está instalado:
// ls src/components/ui/ | grep select
// Se não: npx shadcn@latest add select
```

**Nota**: `Select` não estava na lista inicial de 18 componentes instalados na Story 1.1 — verificar antes de usar e instalar se necessário.

### Ficheiros a Criar/Modificar

```
NOVOS:
src/components/admin/analytics-chart.tsx       # Client Component: gráfico de linha Recharts
src/components/admin/agent-analytics-panel.tsx # Client Component: seletor agente + SWR + métricas

MODIFICADOS:
src/app/(admin)/analytics/page.tsx             # Estender com per-specialist analytics (criado Story 5.1)
src/app/api/admin/analytics/route.ts           # Estender com ?specialistId= e ?period= + unstable_cache
src/components/ui/chart.tsx                    # Instalar via: npx shadcn@latest add chart
```

### Guardrails — O Que NÃO Fazer

- **NÃO** fazer queries Stripe nesta página — métricas são inteiramente do banco Prisma
- **NÃO** usar `groupBy` do Prisma para time-series diária — usar `$queryRaw` com DATE() truncation
- **NÃO** fazer queries sequenciais para múltiplos especialistas — usar `Promise.all()` obrigatoriamente
- **NÃO** esquecer `unstable_cache` — analytics queries são pesadas e NÃO devem ser executadas em cada request
- **NÃO** buscar dados de analytics no Server Component diretamente para per-specialist (é dinâmico) — usar SWR no Client Component
- **NÃO** criar novo arquivo `analytics/route.ts` — MODIFICAR o existente da Story 5.1
- **NÃO** esquecer que `$queryRaw` usa nomes de colunas DB (snake_case), não nomes de modelos Prisma (camelCase)
- **NÃO** expor `stripeSubscriptionId` ou `stripeCustomerId` nas respostas de analytics
- **NÃO** calcular retenção de forma que execute N queries (uma por usuário) — usar COUNT agregado
- **NÃO** usar bibliotecas de chart que não sejam Recharts (via ShadCN Chart) — manter consistência com design system

### Dependências entre Stories

| Story | Relação | Impacto |
|---|---|---|
| 5.1 (done by then) | **Pré-requisito direto** | Admin layout, analytics route.ts (estender), MetricsCard, SWR instalado |
| 5.2 (done by then) | **Pré-requisito de dados** | Especialistas criados para ter dados de métricas |
| 5.3 (done by then) | Paralela | Estabelece padrões de autorização admin — reutilizar |
| 3.2 (done by then) | Pré-requisito de dados | Webhooks processam eventos → Subscriptions com status correto |
| 4.1-4.2 (done by then) | Pré-requisito de dados | Chat gera Messages e Conversations — fonte dos dados de analytics |

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.4 Acceptance Criteria, FR38 (métricas de uso por agente), Epic 5 overview]
- [Source: _bmad-output/planning-artifacts/architecture.md — `unstable_cache` padrão obrigatório, `admin/analytics/route.ts` existente, `analytics-chart.tsx`, SWR 2.x, Component Boundaries admin/ (SWR + Server Actions), índices Prisma em createdAt/specialistId/conversationId]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — MetricsCard anatomy (icon+label+value+trend+skeleton), Admin layout (240px sidebar), tabela comparativa, Skeleton states]
- [Source: _bmad-output/planning-artifacts/architecture.md — Server Action Pattern, API Response Pattern, Error Codes (FORBIDDEN 403), $queryRaw usage pattern]
- [Source: prisma/schema.prisma — Message model (@@index([conversationId, createdAt])), Conversation model (@@index([specialistId]), isDeleted, specialistId column), Subscription model (status enum, specialistId)]
- [Source: https://ui.shadcn.com/charts — ShadCN Chart docs (Recharts wrapper)]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Story estende `admin/analytics/route.ts` existente da Story 5.1 (não criar novo arquivo)
- `$queryRaw` necessário para dados diários (Prisma `groupBy` não suporta DATE() truncation nativamente)
- `Promise.all()` obrigatório para métricas comparativas de múltiplos especialistas (evitar N+1)
- `unstable_cache` com revalidate=300 para cache de 5 minutos nas queries pesadas de analytics
- ShadCN Chart (Recharts) precisa ser instalado: `npx shadcn@latest add chart`
- ShadCN `Select` pode precisar ser instalado: `npx shadcn@latest add select`
- Retenção = aproximação via (ativos/histórico*100) — limitação MVP documentada
- `$queryRaw` usa snake_case das colunas DB, não camelCase do schema Prisma
- Analytics per-specialist é dinâmico (SWR) — a parte comparativa pode ser Server Component com cache
- MetricsCard da Story 5.1 deve ser reutilizado com `isLoading` prop para skeleton states

### File List
