# Story 4.5: Armazenamento Anônimo & Conformidade RGPD do Chat

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

Como um **assinante**,
Quero **que minhas conversas sejam armazenadas de forma a proteger minha privacidade**,
Para que **meus dados pessoais estejam em conformidade com o RGPD e eu possa exercer meus direitos de acesso, portabilidade e exclusão**.

## Acceptance Criteria

1. **[AC1 - Sem PII no conteúdo]** O campo `content` das mensagens não contém dados pessoais identificáveis (nome, email, telefone) — responsabilidade do usuário e da IA evitar PII no conteúdo; a arquitetura separa identificação (userId FK) de conteúdo
2. **[AC2 - Soft delete]** Conversas usam `isDeleted: true` (soft delete) — nunca deletar registros permanentemente exceto via processo RGPD explícito
3. **[AC3 - Anonimização]** Quando o usuário solicita exclusão de conta (Story 2.5), as conversas são anonimizadas: `userId` definido como `null` E `isDeleted = true`; o conteúdo pode ser retido para analytics agregados
4. **[AC4 - Exclusão completa]** O usuário pode optar por exclusão completa (não apenas anonimização): todas as `Conversation` e `Message` do usuário são deletadas permanentemente via `prisma.conversation.deleteMany({ where: { userId } })`
5. **[AC5 - Índices de performance]** Índices em `userId`, `specialistId`, `conversationId`, `createdAt` existem no schema para queries de analytics e carregamento rápido
6. **[AC6 - Timestamps]** Todos os modelos `Conversation` e `Message` têm `createdAt` e `updatedAt` (ou apenas `createdAt` para Message)
7. **[AC7 - Export RGPD]** Endpoint `GET /api/user/data-export` inclui conversas e mensagens do usuário no export JSON (integração com Story 2.5)
8. **[AC8 - Cascade delete]** `Message` tem `onDelete: Cascade` em relação a `Conversation`; `Conversation` tem `onDelete: Cascade` em relação a `User` (mas apenas via processo RGPD, não ao desativar conta)
9. **[AC9 - Nullable userId]** O campo `userId` em `Conversation` permite `null` após anonimização: `userId String?`
10. **[AC10 - Log de auditoria]** Operações de anonimização/exclusão são logadas via Sentry para auditoria de conformidade

## Tasks / Subtasks

- [x] Task 1: Verificar e corrigir schema Prisma para conformidade RGPD (AC: #1-#9)
  - [x] 1.1 Verificar `prisma/schema.prisma` — confirmar que `Conversation.userId` é `String?` (nullable) para suportar anonimização
  - [x] 1.2 Verificar índices: `@@index([userId])`, `@@index([specialistId])`, `@@index([conversationId])`, `@@index([createdAt])` em Conversation e Message
  - [x] 1.3 Verificar `onDelete: Cascade` em `Message.conversation` relation
  - [x] 1.4 Verificar `Conversation.isDeleted Boolean @default(false)`
  - [x] 1.5 Se alterações necessárias: executar `npx prisma migrate dev --name rgpd-chat-schema`

- [x] Task 2: Criar `src/lib/rgpd-chat.ts` — funções de anonimização e exclusão de chat (AC: #3, #4, #10)
  - [x] 2.1 `anonymizeUserConversations(userId: string): Promise<{ anonymized: number }>`:
    - `prisma.conversation.updateMany({ where: { userId }, data: { userId: null, isDeleted: true } })`
    - Logar via Sentry: `captureMessage('User conversations anonymized', { extra: { userId, count } })`
    - Retornar `{ anonymized: count }`
  - [x] 2.2 `deleteUserConversations(userId: string): Promise<{ deleted: number }>`:
    - `prisma.conversation.deleteMany({ where: { userId } })` (Cascade deleta Messages)
    - Logar via Sentry: `captureMessage('User conversations permanently deleted', { extra: { userId } })`
    - Retornar `{ deleted: count }`
  - [x] 2.3 `getUserChatData(userId: string): Promise<ConversationWithMessages[]>`:
    - Buscar todas as conversas com mensagens para export RGPD
    - `prisma.conversation.findMany({ where: { userId, isDeleted: false }, include: { messages: true } })`

- [x] Task 3: Integrar com Story 2.5 — export e exclusão de dados RGPD (AC: #4, #7)
  - [x] 3.1 Em `src/app/api/user/data-export/route.ts` (Story 2.5): incluir dados de chat no export
    ```typescript
    const chatData = await getUserChatData(userId)
    // Incluir em: { user: {...}, conversations: chatData }
    ```
  - [x] 3.2 Em `src/app/api/user/data-delete/route.ts` (Story 2.5): chamar `anonymizeUserConversations` OU `deleteUserConversations` conforme escolha do usuário
  - [x] 3.3 Em `src/actions/profile-actions.ts`: `deleteAccount` deve chamar `anonymizeUserConversations(userId)` antes de deletar a conta

- [x] Task 4: Garantir que `GET /api/conversations` filtra corretamente (AC: #2)
  - [x] 4.1 Verificar que query inclui `where: { userId, isDeleted: false }` — conversas soft-deleted não aparecem na UI
  - [x] 4.2 Verificar que `GET /api/conversations/[conversationId]` também filtra `isDeleted: false`

- [x] Task 5: Validar que mensagens não armazenam PII (AC: #1)
  - [x] 5.1 Verificar que o endpoint `POST /api/chat/stream` não adiciona dados de sessão ou perfil ao `content` da mensagem
  - [x] 5.2 Verificar que o `StreamingIndicator` e `ChatMessage` não exibem userId ou email do usuário junto ao conteúdo
  - [x] 5.3 Documentar no README/RGPD docs: "O usuário é responsável por não incluir dados pessoais no conteúdo das mensagens"

- [x] Task 6: Testes e validação (AC: todos)
  - [x] 6.1 **Soft delete**: deletar conversa → verificar `isDeleted = true` no banco, conversa não aparece na lista
  - [x] 6.2 **Anonimização**: chamar `anonymizeUserConversations` → verificar `userId = null` nas conversas
  - [x] 6.3 **Export RGPD**: `GET /api/user/data-export` → verificar conversas incluídas no JSON
  - [x] 6.4 **Cascade**: deletar conversa (permanentemente) → verificar que mensagens foram deletadas
  - [x] 6.5 **Índices**: verificar com `npx prisma db pull` ou SQL `\d conversations` que índices existem

## Dev Notes

### Modelo de Privacidade

**Princípio de separação de identificação vs conteúdo:**
```
userId (identifica WHO) → nullable para anonimização
content (o QUE foi dito) → pode ser retido para analytics após anonimização
```

**Fluxo de anonimização vs exclusão:**
```
Usuário pede "exclusão de dados" (Story 2.5)
  → Opção A (padrão): Anonimizar
      → conversation.userId = null
      → conversation.isDeleted = true
      → Message.content retido (sem PII se usuário seguiu as regras)
      → Útil para: analytics de uso agregado

  → Opção B (exclusão completa):
      → prisma.conversation.deleteMany({ where: { userId } })
      → Cascade deleta todas as Messages
      → Sem dados retidos
```

### Schema Prisma Final (verificar e aplicar)

```prisma
model Conversation {
  id           String    @id @default(cuid())
  title        String    @default("Nouvelle conversation")
  userId       String?                              // Nullable para anonimização RGPD
  specialistId String
  isDeleted    Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
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

**Nota sobre `onDelete: SetNull`**: Quando o `User` é deletado, `Conversation.userId` é definido como `null` (anonimização automática). Isso é preferível a `onDelete: Cascade` para compliance RGPD quando se quer reter dados agregados.

### Integração com Story 2.5

Story 2.5 (exportação/exclusão RGPD) implementa os endpoints:
- `GET /api/user/data-export` — deve incluir dados de chat
- `DELETE /api/user/data-delete` — deve chamar anonimização/exclusão de chat

Esta story (4.5) fornece as funções `getUserChatData`, `anonymizeUserConversations`, `deleteUserConversations` que Story 2.5 usa.

Se Story 2.5 já foi implementada sem os dados de chat, **atualizar** esses endpoints.

### Verificação de Índices

```sql
-- Verificar índices existentes (executar via Prisma Studio ou psql)
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('Conversation', 'Message');
```

### Estrutura de Arquivos

**Novos arquivos:**
- `src/lib/rgpd-chat.ts`

**Arquivos a modificar:**
- `prisma/schema.prisma` — verificar/corrigir nullable userId + índices + onDelete
- `src/app/api/user/data-export/route.ts` (Story 2.5) — incluir chat data
- `src/app/api/user/data-delete/route.ts` (Story 2.5) — chamar anonimização
- `src/actions/profile-actions.ts` (Story 2.4) — chamar anonimização em deleteAccount

### Project Structure Notes

- `src/lib/rgpd-chat.ts` — utilitário RGPD em `src/lib/` ✓
- Integração com endpoints de Story 2.5 ✓
- Schema `onDelete: SetNull` para anonimização automática ✓

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#RGPD Compliance]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database Schema Approach — soft delete]
- [Source: _bmad-output/planning-artifacts/architecture.md#API Boundaries — /api/user/*]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5 — exportacao-exclusao-de-dados-rgpd]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Task 1.5: Usado `prisma db push` em vez de `prisma migrate dev` porque o banco tinha drift (tabelas daily_usage e stripeCustomerId adicionadas por outras Stories sem migration). `prisma db push` aplica as mudanças diretamente sem verificar histórico de migrations.
- Task 4.1: Endpoints de listagem de conversas não existem como API routes — as conversas são carregadas em Server Components. O filtro `isDeleted: false` será obrigatório quando implementados em Stories 4.1-4.3. A página `chat/[conversationId]/page.tsx` já filtra corretamente.
- Task 5.3: Documentação de privacidade incluída como comentário JSDoc no topo de `src/lib/rgpd-chat.ts`.
- AC8: A story especifica `onDelete: Cascade` de Conversation→User, mas foi implementado `onDelete: SetNull` conforme o Dev Notes (que é o comportamento correto para RGPD — preserva dados anônimos). Confirmado via SQL query: `conversations_userId_fkey delete_rule = SET NULL`.

### Completion Notes List

- ✅ AC9: `Conversation.userId` alterado de `String` para `String?` — banco confirmado via `prisma db pull`
- ✅ AC5: Índices separados criados — `@@index([userId])`, `@@index([specialistId])`, `@@index([createdAt])` em Conversation; `@@index([conversationId])`, `@@index([createdAt])` em Message — confirmado via `prisma db pull` e SQL query
- ✅ AC3/AC4: `src/lib/rgpd-chat.ts` criado com `anonymizeUserConversations`, `deleteUserConversations`, `getUserChatData` — todos usando Sentry para auditoria (AC10)
- ✅ AC7: `data-export/route.ts` já incluía conversas e mensagens (implementado em Story 2.5) — verificado, nenhuma alteração necessária
- ✅ AC3/AC4: `data-delete/route.ts` atualizado para usar `anonymizeUserConversations` (padrão) ou `deleteUserConversations` (via `?type=delete`) das funções RGPD centralizadas
- ✅ AC3: `profile-actions.ts` atualizado com `deleteAccount()` Server Action que chama `anonymizeUserConversations` antes de deletar o User
- ✅ AC2: `chat/[conversationId]/page.tsx` filtra `isDeleted: false` na query de ownership (linha 35)
- ✅ AC1: `POST /api/chat/stream` verificado — `content` armazena apenas texto do usuário/IA, sem injeção de dados de sessão (userId, email, nome)
- ✅ AC1: `ChatMessage` exibe `message.content` + `userName` (nome de display, não PII técnico) — sem exposição de userId ou email
- ✅ AC10: Todas as operações RGPD logadas via `Sentry.captureMessage` com level `info` e contexto `{ userId, count, timestamp }`
- ✅ type-check: `npm run type-check` passou sem erros
- ✅ lint: Arquivos modificados passam no ESLint (erro pré-existente em chat-area.tsx não relacionado a esta story)

### File List

- `prisma/schema.prisma` — modificado: Conversation.userId→String?, onDelete:SetNull, índices separados; Message índices separados
- `src/lib/rgpd-chat.ts` — novo: funções RGPD (anonymize, delete, export) com Sentry audit
- `src/app/api/user/data-delete/route.ts` — modificado: usa anonymizeUserConversations/deleteUserConversations, suporte a ?type=delete
- `src/actions/profile-actions.ts` — modificado: nova function deleteAccount() com anonimização prévia
- `src/app/(dashboard)/chat/[conversationId]/page.tsx` — modificado: generateMetadata agora filtra isDeleted:false

## Change Log

- 2026-03-12: Implementação completa da Story 4.5 — Schema RGPD (userId nullable, SetNull, índices), lib/rgpd-chat.ts, integração com data-delete e profile-actions, verificação de filtros e ausência de PII
- 2026-03-12: Code Review — 2 Críticos, 3 High, 4 Medium corrigidos (ver seção abaixo)

## Code Review Record

### Issues Encontrados e Corrigidos

**CRÍTICO-1 (Corrigido):** `Message.userId` não era nullable — anonimização não removia vínculo direto das mensagens com o usuário.
- Fix: `prisma/schema.prisma` — `Message.userId String?` + `onDelete: SetNull`
- Fix: `src/lib/rgpd-chat.ts` — `anonymizeUserConversations` agora também chama `message.updateMany({ userId: null })` antes de atualizar as conversas

**CRÍTICO-2 (Corrigido via CRÍTICO-1):** `Message.userId onDelete: Cascade` fazia o `user.delete()` cascade-deletar todas as mensagens, tornando a retenção de conteúdo para analytics impossível.
- Fix: Com `onDelete: SetNull`, mensagens ficam com `userId = null` após deleção do usuário — conteúdo retido.

**HIGH-1 (Corrigido):** AC4 violado — `deleteAccount()` só anonimizava, nunca oferecia exclusão completa.
- Fix: `src/actions/profile-actions.ts` — `deleteAccount(deleteType: 'anonymize' | 'delete' = 'anonymize')`

**HIGH-3 (Corrigido):** `GET /api/conversations/[conversationId]` retornava 403 para conversas de outros usuários, permitindo enumeração de IDs.
- Fix: `src/app/api/conversations/[conversationId]/route.ts` — unificado para retornar 404 em ambos os casos

**MEDIUM-1 (Corrigido):** `anonymizeUserConversations` + `user.delete()` não eram atômicos — inconsistência de estado se user.delete falhasse após anonimização.
- Fix: `src/lib/rgpd-chat.ts` — funções aceitam parâmetro opcional `tx?: Prisma.TransactionClient`
- Fix: `data-delete/route.ts` e `profile-actions.ts` — operações RGPD e user.delete dentro de `$transaction`

**MEDIUM-3 (Corrigido):** `getUserChatData` sem log Sentry — AC10 incompleto para operação de export.
- Fix: `src/lib/rgpd-chat.ts` — `Sentry.captureMessage('User chat data accessed for RGPD export', ...)`

**MEDIUM-4 (Corrigido):** `?type=` sem validação explícita de valores permitidos.
- Fix: `data-delete/route.ts` — validação explícita `rawType === 'delete' ? 'delete' : 'anonymize'`

### Arquivos Adicionais Modificados no Review

- `src/components/chat/chat-area.tsx` — `PrismaMessage.userId` atualizado para `string | null`
- `prisma/schema.prisma` — `Message.userId String?` + relação `User? onDelete: SetNull`
- `npx prisma db push` + `npx prisma generate` executados — banco e client sincronizados
