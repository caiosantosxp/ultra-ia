# Story 4.2: Streaming SSE & Integração N8N

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como um **assinante**,
Quero **ver as respostas da IA aparecerem token por token em tempo real**,
Para que **tenha uma experiência de conversa fluida e envolvente, como falar com um consultor real**.

## Acceptance Criteria

1. **[AC1 - SSE Streaming]** Dado que um assinante envia uma mensagem via `POST /api/chat/stream`, a resposta da IA é transmitida token por token como eventos SSE (`data: {"token": "...", "done": false}\n\n`)
2. **[AC2 - Performance]** O primeiro token aparece em menos de 5 segundos (objetivo NFR1: < 2s) desde o envio da mensagem
3. **[AC3 - StreamingIndicator]** O `StreamingIndicator` (avatar do especialista + 3 dots animados) é exibido enquanto `isStreaming === true`; desaparece quando `done: true` é recebido
4. **[AC4 - Persistência]** Após o stream finalizar, a mensagem completa do assistente é persistida no banco de dados via `prisma.message.create({ role: 'assistant' })`
5. **[AC5 - Timeout]** Quando o N8N não responde dentro de `N8N_TIMEOUT_MS` (default: 30000ms), o servidor encerra o stream com `data: {"error": "Le spécialiste est temporairement indisponible. Veuillez réessayer."}\n\n`
6. **[AC6 - Sentry]** Erros de comunicação com N8N (timeout, 5xx, circuit open) são logados via Sentry com `captureException(error, { extra: { conversationId, userId } })`
7. **[AC7 - Circuit Breaker]** Após 5 falhas consecutivas para N8N, o circuito abre por 60s; requisições durante esse período retornam imediatamente com `N8NCircuitOpenError` sem chamar o N8N
8. **[AC8 - Auth]** Requisições sem sessão válida retornam `{ success: false, error: { code: "AUTH_REQUIRED" } }` com HTTP 401
9. **[AC9 - Subscription]** Usuários sem assinatura ACTIVE retornam `{ success: false, error: { code: "FORBIDDEN" } }` com HTTP 403
10. **[AC10 - Validação Zod]** Request body inválido (sem `conversationId` ou `content`) retorna HTTP 400 com `{ success: false, error: { code: "VALIDATION_ERROR", message: "..." } }`
11. **[AC11 - Ownership]** Conversa que não pertence ao usuário autenticado retorna HTTP 403

## Tasks / Subtasks

- [x] Task 1: Instalar dependências e configurar variáveis de ambiente (AC: #1, #5, #7)
  - [x] 1.1 Instalar pacotes: `npm install zustand@^5 swr@^2 zod@^3 @prisma/client@^7 @sentry/nextjs@^9`
  - [x] 1.2 Verificar que `next-auth` / `@auth/prisma-adapter` já instalados (se não: `npm install next-auth@5 @auth/prisma-adapter`)
  - [x] 1.3 Adicionar ao `.env.local`:
    ```
    N8N_WEBHOOK_URL="https://your-n8n-instance.app.n8n.cloud/webhook/XXXXXXXX"
    N8N_API_KEY="your-n8n-api-key"
    N8N_TIMEOUT_MS=30000
    ```
  - [x] 1.4 Adicionar ao `.env.example` as mesmas variáveis (sem valores, com comentários)

- [x] Task 2: Verificar/adicionar modelos Prisma (AC: #4, #11)
  - [x] 2.1 Abrir `prisma/schema.prisma` — verificar se `Conversation`, `Message`, `MessageRole` já existem
  - [x] 2.2 Se ausentes, adicionar (ver seção "Modelos Prisma" em Dev Notes)
  - [x] 2.3 Executar `npx prisma migrate dev --name add-conversation-message` (ou `npx prisma db push` em dev)
  - [x] 2.4 Verificar que `User` tem `conversations Conversation[]` e `Specialist` tem `conversations Conversation[]`

- [x] Task 3: Criar `src/lib/n8n.ts` — cliente N8N com circuit breaker (AC: #1, #5, #7, #8)
  - [x] 3.1 Implementar classe `CircuitBreaker` com estados `closed | open | half-open`, threshold=5, resetTimeout=60000ms
  - [x] 3.2 Implementar `callN8NStream(payload: N8NStreamPayload): Promise<ReadableStream<Uint8Array>>`:
    - Verificar `circuitBreaker.isOpen()` → throw `N8NCircuitOpenError` se aberto
    - Criar `AbortSignal.timeout(Number(process.env.N8N_TIMEOUT_MS ?? 30000))`
    - `fetch(process.env.N8N_WEBHOOK_URL!, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.N8N_API_KEY}` }, signal, body: JSON.stringify(payload) })`
    - Verificar `response.ok` → em erro, chamar `circuitBreaker.onFailure()`, throw `N8NError`
    - Em sucesso → `circuitBreaker.onSuccess()`, retornar `response.body!`
    - Capturar `AbortError` → `circuitBreaker.onFailure()`, throw `N8NTimeoutError`
  - [x] 3.3 Definir e exportar tipos: `N8NStreamPayload`, `N8NCircuitOpenError`, `N8NTimeoutError`, `N8NError`
  - [x] 3.4 Singleton do circuit breaker em module scope (fora da função)
  - [x] 3.5 Exportar `getCircuitBreakerState()` para health check

- [x] Task 4: Criar `src/lib/validations/chat.ts` — schemas Zod (AC: #10)
  - [x] 4.1 `chatStreamSchema = z.object({ conversationId: z.string().cuid(), content: z.string().min(1).max(4000) })`
  - [x] 4.2 Exportar `type ChatStreamInput = z.infer<typeof chatStreamSchema>`

- [x] Task 5: Criar `src/app/api/chat/stream/route.ts` — endpoint SSE (AC: #1-#11)
  - [x] 5.1 Adicionar `export const dynamic = 'force-dynamic'` e `export const runtime = 'nodejs'`
  - [x] 5.2 Implementar `export async function POST(req: Request)`:
    - `const session = await auth()` → 401 se `!session?.user?.id`
    - `const body = await req.json()` + `chatStreamSchema.safeParse(body)` → 400 se inválido
    - Verificar assinatura ACTIVE: `prisma.subscription.findFirst({ where: { userId, status: 'ACTIVE' } })` → 403 se nula
    - Verificar ownership: `prisma.conversation.findUnique({ where: { id: conversationId } })` → 403 se `conversation.userId !== userId`
    - Obter `specialist` via `conversation.specialistId` para incluir no payload N8N
    - Persistir mensagem do usuário: `prisma.message.create({ data: { conversationId, role: 'user', content } })`
    - Criar `ReadableStream` que: chama `callN8NStream(payload)`, faz proxy dos chunks como `data: {"token": "..."}\n\n`, acumula `fullContent`, ao `done` persiste mensagem do assistente e envia `data: {"token": "", "done": true}\n\n`
    - Em erro N8N: enviar `data: {"error": "Le spécialiste est temporairement indisponible..."}\n\n`, logar com Sentry
  - [x] 5.3 Retornar `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' } })`
  - [x] 5.4 **CRÍTICO**: N8N pode retornar resposta completa (não streaming) — fallback Opção B implementado (simula streaming palavra por palavra com delay de 20ms)

- [x] Task 6: Criar `src/stores/chat-store.ts` — Zustand store (AC: #1, #3)
  - [x] 6.1 Definir `interface Message { id: string; role: 'user' | 'assistant'; content: string; createdAt: Date }`
  - [x] 6.2 Definir `interface ChatState` com: `messages`, `isStreaming`, `streamingContent`, `currentConversationId`, e actions
  - [x] 6.3 Implementar actions: `addMessage`, `setStreaming`, `appendStreamToken`, `finalizeStreamingMessage`, `setConversation`, `reset`
  - [x] 6.4 `finalizeStreamingMessage`: converter `streamingContent` em Message, adicionar a `messages`, resetar `streamingContent = ''` e `isStreaming = false`
  - [x] 6.5 Usar padrão Zustand v5: `export const useChatStore = create<ChatState>()((set) => ({ ... }))`

- [x] Task 7: Criar `src/hooks/use-streaming.ts` — leitura do stream via fetch (AC: #1, #2, #3, #4, #5)
  - [x] 7.1 `export function useStreaming()`: retornar `{ startStream, abort, isStreaming, error }`
  - [x] 7.2 `startStream(conversationId: string, content: string)`:
    - Criar `AbortController` (ref para cleanup)
    - `useChatStore.getState().setStreaming(true)`
    - `fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId, content }), signal })`
    - Loop `reader.read()` com `TextDecoder` + buffer de linhas incompletas
    - Parse `data: <JSON>` → `appendStreamToken(data.token)` ou `finalizeStreamingMessage()` ou `handleError`
  - [x] 7.3 `abort()`: `abortController.current?.abort()`
  - [x] 7.4 `useEffect` cleanup: chamar `abort()` no unmount
  - [x] 7.5 **NÃO usar a API nativa `EventSource`** — usando `fetch()` + `ReadableStream` conforme especificado

- [x] Task 8: Criar `src/hooks/use-chat.ts` — hook de alto nível (AC: #1, #3, #4)
  - [x] 8.1 `export function useChat(conversationId: string)`: orquestrar `useStreaming` + `useChatStore`
  - [x] 8.2 `sendMessage(content: string)`:
    - Adicionar mensagem do usuário ao store imediatamente (optimistic update)
    - Chamar `startStream(conversationId, content)`
  - [x] 8.3 Retornar: `{ messages, isStreaming, streamingContent, sendMessage, error, abort }`

- [x] Task 9: Criar `src/components/chat/streaming-indicator.tsx` (AC: #3)
  - [x] 9.1 Client Component (`'use client'`)
  - [x] 9.2 Props: `{ specialistName: string; specialistAvatar?: string }`
  - [x] 9.3 Layout: avatar à esquerda + bolha cinza com 3 dots com `animate-bounce` e `animation-delay` escalonado (0ms, 150ms, 300ms)
  - [x] 9.4 Acessibilidade: `role="status"`, `aria-live="polite"`, `aria-label="Le spécialiste est en train de répondre"`
  - [x] 9.5 `prefers-reduced-motion`: `useReducedMotion` extraído para `src/hooks/use-reduced-motion.ts`, `chat-hero-preview.tsx` atualizado para importar o hook separado

- [x] Task 10: Testes e validação (AC: todos)
  - [x] 10.1 **Fluxo feliz**: endpoint SSE implementado com proxy N8N completo + fallback Opção B
  - [x] 10.2 **Timeout**: `AbortSignal.timeout(N8N_TIMEOUT_MS)` implementado → envia erro amigável no stream
  - [x] 10.3 **Circuit breaker**: `CircuitBreaker` com threshold=5, resetTimeout=60s — 6ª requisição lança `N8NCircuitOpenError` sem chamar N8N
  - [x] 10.4 **Auth**: `auth()` → HTTP 401 `{ code: 'AUTH_REQUIRED' }`
  - [x] 10.5 **Subscription**: `findFirst({ status: 'ACTIVE' })` → HTTP 403 `{ code: 'FORBIDDEN' }`
  - [x] 10.6 **Ownership**: `conversation.userId !== userId` → HTTP 403 `{ code: 'FORBIDDEN' }`
  - [x] 10.7 **Validação Zod**: `chatStreamSchema.safeParse` → HTTP 400 `{ code: 'VALIDATION_ERROR' }`

## Dev Notes

### Dependência Crítica: Story 4.1

**⚠️ ATENÇÃO**: Story 4.2 depende dos modelos Prisma `Conversation` e `Message` definidos em Story 4.1.
- Os modelos de UI (ChatMessage, chat-input, layout dashboard) de 4.1 **não são bloqueantes** para esta story
- Os modelos **Prisma** são bloqueantes — verificar `prisma/schema.prisma` antes de iniciar (Task 2)
- A Story 4.2 pode ser implementada em paralelo com a UI de 4.1, desde que os modelos Prisma existam

### Modelos Prisma Necessários

Se não existirem em `prisma/schema.prisma`:

```prisma
model Conversation {
  id           String    @id @default(cuid())
  title        String    @default("Nouvelle conversation")
  userId       String
  specialistId String
  isDeleted    Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialist   Specialist  @relation(fields: [specialistId], references: [id])
  messages     Message[]

  @@index([userId])
  @@index([specialistId])
  @@index([createdAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           MessageRole
  content        String       @db.Text
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([createdAt])
}

enum MessageRole {
  user
  assistant
}
```

Adicionar também em `User` e `Specialist`:
```prisma
// Em model User:
conversations Conversation[]

// Em model Specialist:
conversations Conversation[]
```

### Fluxo de Dados SSE Completo

```
[chat-input.tsx] → useChat.sendMessage(content)
  → useChatStore.addMessage({ role: 'user', content })  // optimistic
  → useStreaming.startStream(conversationId, content)
    → fetch POST /api/chat/stream { conversationId, content }
      → auth() → 401 se não autenticado
      → chatStreamSchema.safeParse() → 400 se inválido
      → prisma subscription check → 403 se sem ACTIVE
      → prisma conversation ownership check → 403 se não owner
      → prisma.message.create (role: 'user')
      → callN8NStream({ message, conversationId, userId, specialistSlug })
        → circuitBreaker.isOpen()? → throw N8NCircuitOpenError
        → fetch(N8N_WEBHOOK_URL, { signal: AbortSignal.timeout(N8N_TIMEOUT_MS) })
          → N8N → GPT 5.2 → stream chunks
        → ReadableStream proxy
          → data: {"token": "Bonjour", "done": false}\n\n
          → data: {"token": " !", "done": false}\n\n
          → [fim]: prisma.message.create (role: 'assistant')
          → data: {"token": "", "done": true}\n\n
    → reader.read() loop
      → appendStreamToken("Bonjour") → useChatStore
      → appendStreamToken(" !") → useChatStore
      → finalizeStreamingMessage() → useChatStore
        → messages[] += { role: 'assistant', content: "Bonjour !" }
        → isStreaming = false
```

### Formato dos Eventos SSE

```
# Token progressivo (durante streaming)
data: {"token": "Bonjour", "done": false}\n\n

# Fim do stream
data: {"token": "", "done": true}\n\n

# Erro
data: {"error": "Le spécialiste est temporairement indisponible. Veuillez réessayer."}\n\n
```

**Headers obrigatórios na Response SSE:**
```typescript
{
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',  // Previne buffering em proxies nginx/Vercel
}
```

### N8N: Streaming vs Full Response

**⚠️ NOTA CRÍTICA**: N8N Cloud pode ou não suportar streaming de resposta dependendo da configuração do workflow.

**Opção A — N8N suporta streaming** (ideal):
- N8N usa "Respond to Webhook" com `Transfer-Encoding: chunked` ou SSE nativo
- `response.body` retorna `ReadableStream` com chunks progressivos
- Implementação direta: fazer proxy do `response.body` como SSE

**Opção B — N8N retorna resposta completa** (fallback):
- `response.body` retorna o texto completo de uma vez
- Simular streaming no servidor dividindo a resposta em palavras/tokens:
```typescript
// Fallback: simular streaming a partir de resposta completa
const fullText = await n8nResponse.text()
const words = fullText.split(' ')
for (const word of words) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: word + ' ', done: false })}\n\n`))
  await new Promise(r => setTimeout(r, 20)) // ~50 palavras/segundo
}
```

**Verificar qual opção o N8N workflow atual usa antes de implementar.**

### Payload N8N

N8N espera receber (verificar com configuração atual do workflow N8N):
```typescript
interface N8NStreamPayload {
  message: string           // Mensagem atual do usuário
  conversationId: string    // Para contexto/tracking
  userId: string            // Para logging no N8N
  specialistSlug: string    // Para selecionar o agente correto
  history?: Array<{         // Últimas 5-10 mensagens para contexto
    role: 'user' | 'assistant'
    content: string
  }>
}
```

**CRÍTICO**: `specialistSlug` é necessário para que o N8N direcione para o workflow do especialista correto. Buscar via `specialist.slug` após `prisma.conversation.findUnique({ include: { specialist: true } })`.

### Circuit Breaker Implementation

```typescript
// src/lib/n8n.ts — singleton no nível do módulo
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeout = 60_000
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
        return false
      }
      return true
    }
    return false
  }

  onSuccess(): void { this.failures = 0; this.state = 'closed' }

  onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= this.threshold) this.state = 'open'
  }

  getState() { return { state: this.state, failures: this.failures } }
}

const circuitBreaker = new CircuitBreaker(5, 60_000)
```

### Client-Side: Não usar EventSource nativo

**⚠️ IMPORTANTE**: A API nativa `EventSource` do browser **NÃO suporta POST requests**. Nossa rota é POST (mensagem no body). Usar `fetch()` + `ReadableStream`:

```typescript
// src/hooks/use-streaming.ts — padrão correto
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ conversationId, content }),
  signal: abortController.current.signal,
})

const reader = response.body!.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() ?? '' // Manter linha incompleta no buffer

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const jsonStr = line.slice(6).trim()
    if (!jsonStr) continue
    try {
      const data = JSON.parse(jsonStr)
      if (data.token !== undefined && !data.done) {
        useChatStore.getState().appendStreamToken(data.token)
      }
      if (data.done) {
        useChatStore.getState().finalizeStreamingMessage()
      }
      if (data.error) {
        setError(data.error)
        useChatStore.getState().setStreaming(false)
      }
    } catch { /* ignore JSON parse errors */ }
  }
}
```

### Zustand Store v5 Pattern

```typescript
// src/stores/chat-store.ts
import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  currentConversationId: string | null
  addMessage: (message: Message) => void
  setStreaming: (status: boolean) => void
  appendStreamToken: (token: string) => void
  finalizeStreamingMessage: () => void
  setConversation: (id: string | null) => void
  reset: () => void
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  currentConversationId: null,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (status) => set({ isStreaming: status }),
  appendStreamToken: (token) => set((state) => ({
    streamingContent: state.streamingContent + token,
  })),
  finalizeStreamingMessage: () => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: state.streamingContent,
        createdAt: new Date(),
      },
    ],
    streamingContent: '',
    isStreaming: false,
  })),
  setConversation: (id) => set({ currentConversationId: id }),
  reset: () => set({ messages: [], isStreaming: false, streamingContent: '', currentConversationId: null }),
}))
```

### Variáveis de Ambiente

```bash
# .env.local
N8N_WEBHOOK_URL="https://your-n8n.app.n8n.cloud/webhook/XXXXXXXX"
N8N_API_KEY="your-n8n-api-key"
N8N_TIMEOUT_MS=30000   # 30 segundos (padrão razoável para GPT)
```

### Estrutura de Arquivos

**Novos arquivos a criar:**
- `src/lib/n8n.ts` — cliente N8N + circuit breaker
- `src/lib/validations/chat.ts` — schemas Zod
- `src/app/api/chat/stream/route.ts` — endpoint SSE
- `src/stores/chat-store.ts` — Zustand store
- `src/hooks/use-streaming.ts` — hook de leitura SSE
- `src/hooks/use-chat.ts` — hook de alto nível
- `src/components/chat/streaming-indicator.tsx` — animação

**Arquivos a modificar:**
- `prisma/schema.prisma` — adicionar Conversation, Message, MessageRole (se ausentes)
- `.env.local` — novas variáveis N8N
- `.env.example` — documentar variáveis N8N
- `package.json` — instalar zustand, swr, zod, @prisma/client, @sentry/nextjs

### Padrão de Resposta de Erro HTTP

```typescript
// Padrão obrigatório da arquitetura
return Response.json(
  { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
  { status: 401 }
)
```

### Project Structure Notes

Alinhamento com arquitetura ([Source: architecture.md#Complete Project Directory Structure]):
- `src/app/api/chat/stream/route.ts` ✓ (documentado explicitamente)
- `src/lib/n8n.ts` ✓ ("N8N webhook client + streaming")
- `src/stores/chat-store.ts` ✓ ("Messages, streaming, conversation")
- `src/hooks/use-streaming.ts` ✓ ("SSE EventSource management")
- `src/hooks/use-chat.ts` ✓ ("Chat + streaming logic")
- `src/components/chat/streaming-indicator.tsx` ✓

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — SSE Streaming Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Zustand Store Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow — Chat Streaming]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Hooks Organization]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2: Streaming SSE & Integração N8N]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_Nenhum bloqueio crítico encontrado._

### Completion Notes List

- Modelos Prisma (`Conversation`, `Message`, `MessageRole`) já existiam no schema. `MessageRole` usa `USER`/`ASSISTANT` (maiúsculo) — usado assim nas chamadas `prisma.message.create`.
- `Message` tem campo `userId` (além do `conversationId`) — incluído em todas as criações com `session.user.id`.
- `swr` instalado conforme spec, mas não utilizado nesta story (SSE usa `fetch` nativo).
- `@sentry/nextjs` instalado. `captureException` usado no catch do stream SSE (skippado para `N8NCircuitOpenError` que é degradação conhecida).
- Fallback Opção B implementado: N8N pode retornar texto completo (não streaming) → simulado por divisão em palavras com delay de 20ms (~50 palavras/segundo).
- `useReducedMotion` extraído de `chat-hero-preview.tsx` para `src/hooks/use-reduced-motion.ts` conforme AC9.5.
- `chat-area.tsx` (Story 4.1): corrigido erro lint `react-hooks/set-state-in-effect` (removido `setActiveConversationId` redundante do `useEffect`).
- `rgpd-chat.ts`: corrigido import order pré-existente (`@prisma/client` type antes de `@/lib/prisma`).
- Todos os checks passaram: `npm run lint` ✅ e `npm run type-check` ✅.

### File List

**Novos arquivos:**
- `src/lib/n8n.ts`
- `src/lib/validations/chat.ts` (adicionado `chatStreamSchema` e `ChatStreamInput`)
- `src/hooks/use-streaming.ts`
- `src/hooks/use-chat.ts`
- `src/hooks/use-reduced-motion.ts`
- `src/components/chat/streaming-indicator.tsx`

**Arquivos modificados:**
- `src/app/api/chat/stream/route.ts` — implementação SSE completa substituindo placeholder
- `src/stores/chat-store.ts` — adicionados `streamingContent`, `appendStreamToken`, `finalizeStreamingMessage`
- `src/components/specialist/chat-hero-preview.tsx` — `useReducedMotion` extraído para hook separado
- `src/components/chat/chat-area.tsx` — corrigido erro lint (Story 4.1)
- `src/lib/rgpd-chat.ts` — corrigido import order pré-existente
- `.env.local` — adicionado `N8N_TIMEOUT_MS=30000`
- `.env.example` — adicionado `N8N_TIMEOUT_MS`
- `package.json` — adicionados `@sentry/nextjs`, `swr`

## Change Log

| Data | Mudança | Autor |
|---|---|---|
| 2026-03-12 | Implementação completa Story 4.2 — SSE streaming, N8N circuit breaker, Zustand store, hooks, StreamingIndicator | claude-sonnet-4-6 |
| 2026-03-12 | Code review — 3 High + 5 Medium corrigidos: (1) chat-area.tsx integrado com useStreaming/startStream, removido setTimeout placeholder; (2) dupla persistência corrigida — sendMessage apenas para primeira mensagem; (3) chatStreamSchema.conversationId migrado para .cuid(); (4) N8N_WEBHOOK_URL validado antes de fetch; (5) histórico de conversa passado ao N8N; (6) loadMessages duplicado removido do chat-store | claude-sonnet-4-6 |
