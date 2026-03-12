# Story 4.4: Controle de Escopo, Disclaimers & Rate Limiting

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como um **assinante**,
Quero **que a IA fique dentro de seu domínio de expertise e exiba disclaimers apropriados**,
Para que **receba orientação confiável e entenda as limitações do serviço**.

## Acceptance Criteria

1. **[AC1 - Escopo N8N]** A IA responde contextualmente dentro do domínio do especialista (FR24); perguntas fora do escopo retornam redirecionamento educado (FR25); configuração de escopo gerenciada no N8N (system prompt), não em código
2. **[AC2 - Redirecionamento]** Quando a IA detecta pergunta fora do escopo, responde: "Cette question concerne un domaine en dehors de mon expertise. Je vous suggère de consulter un profissional certifié pour..." + quick prompts dentro do escopo (FR25, FR27)
3. **[AC3 - DisclaimerBanner]** O componente `DisclaimerBanner` é exibido permanentemente na base da área de chat: "Je suis une IA spécialisée et ne remplace pas un professionnel certifié." (FR26)
4. **[AC4 - UsageMeter]** O componente `UsageMeter` exibe contagem "X/100 messages aujourd'hui" no header/topo do chat
5. **[AC5 - Warning 90%]** Quando o usuário atinge 90 mensagens no dia (90%), o `UsageMeter` muda para cor warning (amarelo/âmbar)
6. **[AC6 - Limite atingido]** Quando o usuário atinge 100 mensagens no dia (FR23), o input é desabilitado, `UsageMeter` muda para vermelho, e uma mensagem é exibida: "Vous avez atteint la limite quotidienne. Revenez demain!"
7. **[AC7 - Reset meia-noite]** O contador de mensagens diárias resetar à meia-noite UTC; o limite é por dia calendário UTC
8. **[AC8 - Rate limit API]** A rota `POST /api/chat/stream` verifica o contador diário do usuário antes de processar; retorna 429 se limite atingido com `{ code: 'RATE_LIMIT', message: 'Daily message limit reached' }`
9. **[AC9 - Persistência contador]** O contador de mensagens diárias é armazenado por usuário + dia no banco de dados (tabela `DailyUsage`) para persistência entre reinicializações do servidor
10. **[AC10 - Context N8N]** O payload enviado ao N8N inclui o `specialistSlug` para que o N8N possa aplicar o system prompt correto do especialista

## Tasks / Subtasks

- [ ] Task 1: Adicionar modelo `DailyUsage` ao Prisma (AC: #9)
  - [ ] 1.1 Adicionar em `prisma/schema.prisma`:
    ```prisma
    model DailyUsage {
      id        String   @id @default(cuid())
      userId    String
      date      String   // formato "YYYY-MM-DD" (UTC)
      count     Int      @default(0)
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt

      user User @relation(fields: [userId], references: [id], onDelete: Cascade)

      @@unique([userId, date])
      @@index([userId])
    }
    ```
  - [ ] 1.2 Adicionar `dailyUsage DailyUsage[]` ao model `User`
  - [ ] 1.3 Executar `npx prisma migrate dev --name add-daily-usage`

- [ ] Task 2: Criar `src/lib/rate-limit.ts` — helper de rate limiting por usuário (AC: #8, #9)
  - [ ] 2.1 `getTodayUTC(): string`: retornar data atual em UTC como "YYYY-MM-DD" usando `new Date().toISOString().split('T')[0]`
  - [ ] 2.2 `checkAndIncrementDailyUsage(userId: string, limit = 100): Promise<{ allowed: boolean; current: number; limit: number }>`:
    - Upsert `DailyUsage` com `{ userId, date: getTodayUTC() }`
    - Se `count >= limit` → retornar `{ allowed: false, current: count, limit }`
    - Incrementar: `prisma.dailyUsage.update({ data: { count: { increment: 1 } } })`
    - Retornar `{ allowed: true, current: newCount, limit }`
  - [ ] 2.3 `getDailyUsage(userId: string): Promise<{ current: number; limit: number }>`:
    - Buscar registro atual sem incrementar; retornar `{ current: count ?? 0, limit: 100 }`

- [ ] Task 3: Atualizar `src/app/api/chat/stream/route.ts` — adicionar rate limit check (AC: #8)
  - [ ] 3.1 Após verificação de assinatura, antes de chamar N8N, chamar `checkAndIncrementDailyUsage(userId)`
  - [ ] 3.2 Se `!allowed`: retornar `Response.json({ success: false, error: { code: 'RATE_LIMIT', message: 'Daily message limit reached' } }, { status: 429 })`
  - [ ] 3.3 Incluir headers de rate limit na response: `X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: {limit - current}`

- [ ] Task 4: Criar endpoint `GET /api/user/usage` — usage atual (AC: #4, #5, #6)
  - [ ] 4.1 `src/app/api/user/usage/route.ts`: `auth()` → 401; chamar `getDailyUsage(userId)`; retornar `{ success: true, data: { current, limit, resetAt: 'midnight UTC' } }`
  - [ ] 4.2 Exportar `export const dynamic = 'force-dynamic'`

- [ ] Task 5: Criar `src/components/chat/disclaimer-banner.tsx` — banner permanente (AC: #3)
  - [ ] 5.1 Server ou Client Component simples
  - [ ] 5.2 Layout: ícone de aviso (AlertTriangle do lucide-react) + texto "Je suis une IA spécialisée et ne remplace pas un professionnel certifié."
  - [ ] 5.3 Estilo: fundo `bg-muted`, texto `text-muted-foreground text-xs`, padding pequeno, borda top
  - [ ] 5.4 Acessibilidade: `role="note"`, `aria-label="Avertissement légal"`

- [ ] Task 6: Criar `src/components/chat/usage-meter.tsx` — indicador de uso (AC: #4, #5, #6)
  - [ ] 6.1 Client Component com SWR para buscar `GET /api/user/usage` (revalidar a cada 60s)
  - [ ] 6.2 Props: nenhuma (usa SWR internamente)
  - [ ] 6.3 Display: "X/100" com ícone; cor baseada em:
    - `current < 90`: `text-muted-foreground` (normal)
    - `90 <= current < 100`: `text-warning` / amarelo (`text-amber-500`)
    - `current >= 100`: `text-destructive` / vermelho
  - [ ] 6.4 Barra de progresso opcional: `<progress value={current} max={100}>`
  - [ ] 6.5 Exportar hook `useUsageLimit(): { isLimitReached: boolean; current: number; limit: number }` para uso em `chat-input.tsx`

- [ ] Task 7: Atualizar `src/components/chat/chat-input.tsx` (Story 4.1) — desabilitar no limite (AC: #6)
  - [ ] 7.1 Importar `useUsageLimit` hook
  - [ ] 7.2 Se `isLimitReached`: `<textarea disabled>` + exibir mensagem "Vous avez atteint la limite quotidienne. Revenez demain!" acima do input
  - [ ] 7.3 Botão de envio: `disabled={isLimitReached || isStreaming}`

- [ ] Task 8: Tratar erro 429 no `src/hooks/use-streaming.ts` (Story 4.2) (AC: #8)
  - [ ] 8.1 Verificar `response.status === 429` após `fetch('/api/chat/stream', ...)`
  - [ ] 8.2 Se 429: setar error state com mensagem "Vous avez atteint la limite quotidienne.", chamar `setStreaming(false)`, **não** iniciar leitura do stream

- [ ] Task 9: DisclaimerBanner e UsageMeter no layout do chat (AC: #3, #4)
  - [ ] 9.1 Em `src/app/(dashboard)/chat/[conversationId]/page.tsx`: incluir `<DisclaimerBanner>` na base do chat (abaixo do chat-input)
  - [ ] 9.2 Em header do chat ou no topo da área de chat: incluir `<UsageMeter>`

- [ ] Task 10: Testes e validação (AC: todos)
  - [ ] 10.1 Verificar `DisclaimerBanner` visível em todas as páginas de chat
  - [ ] 10.2 Verificar `UsageMeter` exibe contagem correta
  - [ ] 10.3 Simular 90 mensagens → verificar cor warning
  - [ ] 10.4 Simular 100 mensagens → verificar input desabilitado + mensagem
  - [ ] 10.5 Verificar rate limit na API: request direto com 100 mensagens → 429
  - [ ] 10.6 Verificar reset: alterar data no banco para data anterior → novo dia reseta contagem

## Dev Notes

### Escopo da IA: Responsabilidade do N8N

**⚠️ IMPORTANTE**: O controle de escopo da IA (AC1, AC2) é gerenciado **no N8N**, não no código Next.js:
- O system prompt do especialista no N8N define os limites de escopo
- A resposta de redirecionamento (AC2) é gerada pelo GPT via N8N
- O código Next.js apenas transmite a resposta via SSE (Story 4.2)
- Os quick prompts fora do escopo são sugeridos pelo GPT na resposta

Nesta story, o foco do código é: DisclaimerBanner, UsageMeter, e rate limiting no servidor.

### Rate Limiting: Banco de Dados vs In-Memory

**Escolha: DailyUsage no banco de dados** (não in-memory Map)

**Rationale**:
- Vercel tem múltiplas instâncias serverless → in-memory Map não é consistente entre instâncias
- DailyUsage persiste entre deploys e reinicializações
- PostgreSQL + Prisma `upsert` é suficiente para MVP sem Redis
- Migrar para Redis/Upstash ao escalar (documentado para futuro)

**Alternativa futura (não implementar agora)**:
```typescript
// Quando escalar: usar Upstash Redis
import { Ratelimit } from '@upstash/ratelimit'
```

### DailyUsage Upsert Pattern

```typescript
// src/lib/rate-limit.ts
export async function checkAndIncrementDailyUsage(userId: string, limit = 100) {
  const date = new Date().toISOString().split('T')[0] // "2026-03-11"

  // Tentar criar ou buscar registro existente
  const usage = await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, count: 0 },
    update: {}, // Não incrementar ainda
  })

  if (usage.count >= limit) {
    return { allowed: false, current: usage.count, limit }
  }

  // Incrementar atomicamente
  const updated = await prisma.dailyUsage.update({
    where: { userId_date: { userId, date } },
    data: { count: { increment: 1 } },
  })

  return { allowed: true, current: updated.count, limit }
}
```

### UsageMeter com SWR

```typescript
// src/components/chat/usage-meter.tsx
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json()).then(r => r.data)

export function UsageMeter() {
  const { data } = useSWR('/api/user/usage', fetcher, { refreshInterval: 60_000 })
  const current = data?.current ?? 0
  const limit = data?.limit ?? 100
  const percentage = (current / limit) * 100

  const colorClass = current >= limit
    ? 'text-destructive'
    : current >= limit * 0.9
    ? 'text-amber-500'
    : 'text-muted-foreground'

  return (
    <div className={`text-xs ${colorClass}`} role="status" aria-label={`${current} sur ${limit} messages aujourd'hui`}>
      {current}/{limit} messages
    </div>
  )
}

// Hook para uso em chat-input
export function useUsageLimit() {
  const { data } = useSWR('/api/user/usage', fetcher, { refreshInterval: 30_000 })
  return {
    isLimitReached: (data?.current ?? 0) >= (data?.limit ?? 100),
    current: data?.current ?? 0,
    limit: data?.limit ?? 100,
  }
}
```

### Estrutura de Arquivos

**Novos arquivos:**
- `src/lib/rate-limit.ts`
- `src/app/api/user/usage/route.ts`
- `src/components/chat/disclaimer-banner.tsx`
- `src/components/chat/usage-meter.tsx`

**Arquivos a modificar:**
- `prisma/schema.prisma` — adicionar DailyUsage
- `src/app/api/chat/stream/route.ts` — adicionar rate limit check
- `src/components/chat/chat-input.tsx` — desabilitar no limite
- `src/hooks/use-streaming.ts` — tratar 429
- `src/app/(dashboard)/chat/[conversationId]/page.tsx` — incluir DisclaimerBanner + UsageMeter

### Project Structure Notes

- `src/lib/rate-limit.ts` — utilitário de rate limiting ✓ (padrão `src/lib/`)
- Rate limiting em API Route (não middleware) para mensagens chat ✓
- SWR para polling de usage no cliente ✓ (`refreshInterval: 60000`)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Rate Limiting — Custom middleware in-memory Map]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Boundaries — /api/chat/* requires subscription]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Response Format — Error codes RATE_LIMIT 429]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
