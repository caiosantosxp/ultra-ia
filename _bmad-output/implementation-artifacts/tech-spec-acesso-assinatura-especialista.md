---
title: 'Fluxo de Acesso por Assinatura por Especialista'
slug: 'acesso-assinatura-especialista'
created: '2026-03-25'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Next.js 15 App Router', 'Prisma 7 (PrismaPg adapter)', 'Auth.js v5', 'TypeScript strict']
files_to_modify:
  - src/app/(dashboard)/chat/page.tsx
  - src/app/(dashboard)/chat/[conversationId]/page.tsx
  - src/actions/chat-actions.ts
  - src/app/api/chat/stream/route.ts
code_patterns:
  - 'Server Component redirect via redirect() from next/navigation'
  - 'prisma.subscription.findFirst com where {userId, specialistId, status: ACTIVE}'
  - 'Server Action: return { success: false as const, error: { code, message } }'
  - 'API route: Response.json({ success: false, error: {code, message} }, { status: 403 })'
test_patterns: ['Vitest + vi.mock para auth e prisma — sem testes nos arquivos modificados']
---

# Tech-Spec: Fluxo de Acesso por Assinatura por Especialista

**Criado:** 2026-03-25

## Overview

### Problem Statement

1. **Usuário novo sem assinatura acessa o `/chat` sem restrição** — após login/registro, o middleware redireciona para `/chat` que renderiza uma tela vazia sem bloquear o acesso.

2. **A assinatura não é verificada por especialista específico** — o endpoint `POST /api/chat/stream` verifica apenas se o usuário tem *qualquer* assinatura ativa (`findFirst({status: 'ACTIVE'})`), sem checar se ela é para o especialista da conversa. Uma assinatura com Expert A permite tecnicamente enviar mensagens com Expert B.

3. **`createConversation` não valida assinatura** — a Server Action cria conversas para qualquer `specialistId` sem verificar se o usuário tem assinatura ativa para aquele especialista.

### Solution

Aplicar guards de assinatura específicos por especialista em três pontos:

1. **Páginas de chat (UI)**: redirecionar para `/` (landing com catálogo de especialistas) se não houver assinatura ativa.
2. **Server Action `createConversation`**: bloquear criação de conversa sem assinatura ativa para o especialista solicitado.
3. **API de streaming** (`/api/chat/stream`): refatorar verificação de assinatura para ser específica ao especialista da conversa.

Múltiplas assinaturas são permitidas (uma por especialista). O usuário paga separadamente por cada expert adicional.

### Scope

**In Scope:**
- Guard na página `/chat`: sem assinatura ativa → `redirect('/')`
- Guard na página `/chat/[conversationId]`: sem assinatura ativa para o especialista da conversa → `redirect('/')`
- Guard na Server Action `createConversation`: checar assinatura ativa para o `specialistId` solicitado
- Refatorar `stream/route.ts`: verificar assinatura específica do especialista da conversa

**Out of Scope:**
- Nova página `/specialists` (usuário escolheu reusar landing pública `/`)
- Alterações no schema do banco de dados
- Alterações no middleware
- UI para gerenciar múltiplas assinaturas
- Fluxo de troca de expert (cancelar e assinar novo)

---

## Context for Development

### Codebase Patterns

- **Server Components**: usar `redirect()` importado de `next/navigation` diretamente no componente assíncrono.
- **Prisma queries**: sempre importar `prisma` de `@/lib/prisma` (singleton com PrismaPg adapter).
- **Auth**: usar `const session = await auth()` de `@/lib/auth`.
- **API responses**: padrão `{ success: false, error: { code: 'FORBIDDEN', message: '...' } }` com status 403.
- **Server Actions**: retornar `{ success: false as const, error: { code, message } }` em caso de erro.
- **`subscription` em `stream/route.ts`**: não é referenciado após o guard — só usado para verificar existência. Refatoração segura.
- **`conversation` em `stream/route.ts`**: query com `findUnique` sem `select` retorna TODOS os campos escalares, incluindo `specialistId`. Sem necessidade de alterar o shape da query.
- **`generateMetadata` em `chat/[conversationId]/page.tsx`**: usa `cache(getConversation)` — o guard de subscription deve ficar APENAS no componente de página (`ConversationPage`), não em `generateMetadata`.
- **Imports já presentes** em todos os 4 arquivos: `prisma`, `auth`, `redirect` — nenhum import novo necessário.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/app/(dashboard)/chat/page.tsx` | Redireciona para última conversa; busca subscription na linha 34 |
| `src/app/(dashboard)/chat/[conversationId]/page.tsx` | Carrega conversa específica; verifica ownership via `getConversation` |
| `src/actions/chat-actions.ts` | Server Action `createConversation` — cria conversa sem checar assinatura |
| `src/app/api/chat/stream/route.ts` | Streaming de mensagens — subscription check genérico (linha 54-63); conversation fetch na linha 81 |
| `prisma/schema.prisma` | Modelo `Subscription`: campos `userId`, `specialistId`, `status: SubscriptionStatus`; `@@unique([userId, specialistId])` |

### Technical Decisions

- **Redirecionar para `/`** (não para `/specialists`) — usuário confirmou reusar o catálogo da landing pública.
- **Ordem das verificações no `stream/route.ts`**: buscar conversa ANTES da assinatura para obter `specialistId`. Sequência nova: auth → parse body → conversation ownership → specialist subscription → rate limit → mensagem.
- **`createConversation` deve bloquear sem assinatura**: impede criação de conversas órfãs com experts não assinados.
- **Múltiplas assinaturas permitidas**: queries usam `findFirst({ where: { userId, specialistId, status: 'ACTIVE' } })`.

---

## Implementation Plan

### Tasks

- [x] Task 1: Adicionar guard de assinatura em `chat/page.tsx`
  - File: `src/app/(dashboard)/chat/page.tsx`
  - Action: Após a query `prisma.subscription.findFirst` (linha 34–37) que já existe, inserir imediatamente antes do `return`:
    ```typescript
    if (!subscription) redirect('/');
    ```
  - Notes: A query já está feita (`findFirst({ where: { userId, status: 'ACTIVE' } })`). Apenas adicionar o redirect. O bloco de redirect para `lastConversation` nas linhas 23–27 continua antes desta query — usuários com conversas existentes mas sem assinatura ativa serão pegos pelo guard da Task 2.

- [x] Task 2: Adicionar guard de assinatura específica em `chat/[conversationId]/page.tsx`
  - File: `src/app/(dashboard)/chat/[conversationId]/page.tsx`
  - Action: No componente `ConversationPage`, após `if (!conversation) notFound()` (linha 58), inserir:
    ```typescript
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        specialistId: conversation.specialistId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    if (!subscription) redirect('/');
    ```
  - Notes: `prisma` já importado (linha 5). `session.user.id` disponível (verificado linha 52). `conversation.specialistId` disponível pois `getConversation` usa `findUnique` sem `select` restritivo — todos os campos escalares retornam. NÃO colocar este guard dentro de `generateMetadata`.

- [x] Task 3: Adicionar guard de assinatura em `createConversation` (Server Action)
  - File: `src/actions/chat-actions.ts`
  - Action: Após a verificação do specialist existir (bloco `if (!specialist)` nas linhas 18–21), antes do `prisma.conversation.create`, inserir:
    ```typescript
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        specialistId: specialist.id,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    if (!subscription) {
      return { success: false as const, error: { code: 'FORBIDDEN', message: 'Assinatura ativa necessária para este especialista' } };
    }
    ```
  - Notes: `prisma` e `session` já disponíveis no escopo da função. `specialist.id` é o campo correto (não `specialist.slug`).

- [x] Task 4: Refatorar verificação de assinatura no `stream/route.ts` para ser específica ao especialista
  - File: `src/app/api/chat/stream/route.ts`
  - Action: Reorganizar o corpo do handler POST. Após a validação Zod (fim da linha 50), **mover** o bloco de fetch da conversation (atualmente linhas 81–90) para imediatamente após `const { conversationId, content } = parsed.data` (linha 51). Em seguida, **substituir** o subscription check genérico (linhas 54–63) pelo check específico ao especialista. O bloco original de conversation nas linhas 81–90 será **removido** (já foi movido para cima).

  Nova sequência de código após `const { conversationId, content } = parsed.data`:

  ```typescript
  // 1. Conversation ownership check (movido para cima para obter specialistId)
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { specialist: { select: { slug: true } } },
  });
  if (!conversation || conversation.userId !== userId) {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  // 2. Subscription check específico ao especialista da conversa
  const subscription = await prisma.subscription.findFirst({
    where: { userId, specialistId: conversation.specialistId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
  if (!subscription) {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Active subscription required' } },
      { status: 403 }
    );
  }

  // 3. Daily rate limit check (mantido na mesma posição relativa)
  const rateLimit = await checkAndIncrementDailyUsage(userId);
  // ... resto do handler continua igual ...
  ```

  - Notes: O bloco original nas linhas 54–63 (subscription genérica) e 81–90 (conversation fetch) são **removidos e substituídos** pelo novo bloco acima. O restante do handler (recentMessages, message.create, title update, SSE stream) permanece idêntico — `conversation` e `specialistSlug` continuam disponíveis no escopo.

### Acceptance Criteria

- [x] AC1: Given um usuário autenticado sem assinatura ativa, when navega para `/chat`, then é redirecionado para `/` (landing page).

- [x] AC2: Given um usuário autenticado sem assinatura ativa para o especialista da conversa, when navega para `/chat/[conversationId]` (mesmo que a conversa exista no banco), then é redirecionado para `/`.

- [x] AC3: Given um usuário autenticado com assinatura ACTIVE para Expert A, when navega para `/chat` ou `/chat/[id_conversa_expert_A]`, then acessa o chat normalmente sem redirecionamento.

- [x] AC4: Given um usuário com assinatura ACTIVE para Expert A (mas não para Expert B), when tenta acessar `/chat/[id_conversa_expert_B]`, then é redirecionado para `/`.

- [x] AC5: Given um usuário sem assinatura ativa para Expert X, when chama a Server Action `createConversation` com `specialistId` de Expert X, then retorna `{ success: false, error: { code: 'FORBIDDEN' } }`.

- [x] AC6: Given um usuário com assinatura ACTIVE para Expert A mas não para Expert B, when envia `POST /api/chat/stream` com `conversationId` de uma conversa com Expert B, then recebe resposta `{ status: 403, error: { code: 'FORBIDDEN' } }`.

- [x] AC7: Given um usuário com assinatura ACTIVE para Expert A e assinatura ACTIVE para Expert B, when acessa chat de Expert A e depois chat de Expert B, then ambos funcionam normalmente.

- [x] AC8: Given novo usuário que acabou de se registrar (sem assinatura), when o middleware redireciona para `/chat`, then `/chat` detecta ausência de assinatura e redireciona para `/`, and o usuário vê a lista de especialistas disponíveis na landing.

---

## Additional Context

### Dependencies

- Nenhuma mudança de schema necessária — `Subscription.specialistId` já existe e está indexado em `prisma/schema.prisma`
- Nenhuma nova dependência de pacote
- Todos os imports necessários (`prisma`, `auth`, `redirect`) já presentes nos 4 arquivos

### Testing Strategy

- **Manual — AC1**: Criar conta nova sem assinar. Navegar para `/chat`. Verificar redirect para `/`.
- **Manual — AC2**: Com conta sem assinatura, acessar URL direta `/chat/[qualquer-id]`. Verificar redirect para `/`.
- **Manual — AC3**: Assinar Expert A. Navegar para `/chat`. Verificar que a landing não aparece e o chat abre.
- **Manual — AC4**: Com assinatura do Expert A, tentar acessar conversa do Expert B via URL direta. Verificar redirect para `/`.
- **Manual — AC5**: Via DevTools ou Postman, chamar `createConversation` com `specialistId` de expert não assinado. Verificar resposta `FORBIDDEN`.
- **Manual — AC6**: Via Postman, enviar `POST /api/chat/stream` com `conversationId` de expert não assinado. Verificar 403.
- **Manual — AC7**: Assinar dois experts. Verificar que ambos os chats funcionam.
- **Manual — AC8**: Registrar novo usuário. Verificar que ao final do registro o usuário vê a landing `/`.

### Notes

- **Risco — duplo redirect para usuários com conversas existentes**: Se um usuário com assinatura expirada tem conversas existentes, `/chat` irá redirecioná-los para a última conversa (linhas 23–27), e então `/chat/[id]` redirecionará para `/`. Isso resulta em 2 redirecionamentos antes de chegar na landing. Comportamento aceitável — sem impacto UX perceptível.
- **`dashboard/layout.tsx` não requer alteração**: O layout usa `findFirst` para mostrar info do especialista na sidebar. Continua funcionando com múltiplas assinaturas (mostra a mais recente).
- **Status `PAST_DUE`**: Usuários com assinatura `PAST_DUE` perdem acesso ao chat (guard verifica apenas `ACTIVE`). Comportamento intencional.
- **Futuro**: Quando houver múltiplos experts assinados e nenhuma conversa, a página `/chat` mostrará o botão "Iniciar conversa" com o expert do `findFirst` — pode ser melhorado no futuro com um seletor de expert.

## Review Notes
- Revisão adversarial concluída
- Findings: 11 total, 0 corrigidos, 11 ignorados (skip)
- Abordagem: skip — user escolheu prosseguir sem fixes
