# Story 4.1: Interface de Chat & Envio de Mensagens

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **subscriber**,
I want **to open a chat interface and send messages to my AI specialist**,
so that **I can start conversations and receive guidance**.

## Acceptance Criteria

1. **Given** um assinante acessa `/chat` **When** a página carrega **Then** o layout dashboard é exibido com sidebar colapsável (280px) à esquerda e área de chat à direita
2. **And** a sidebar mostra o avatar do especialista e botão "+ Nouvelle conversation"
3. **And** ao iniciar nova conversa, uma welcome message do especialista é exibida com 3 quick prompts clicáveis (QuickPrompt components)
4. **Given** um assinante digita uma mensagem no chat input **When** pressiona Enter ou clica no botão enviar **Then** a mensagem é exibida como ChatMessage (bolha primária, alinhada à direita, com timestamp)
5. **And** o StreamingIndicator é exibido (avatar do especialista + 3 dots animados) — indicando que a IA está processando
6. **And** o chat auto-scroll para a última mensagem
7. **And** o modelo Conversation é criado no Prisma com campos: id, title, userId, specialistId, createdAt, updatedAt, isDeleted
8. **And** o modelo Message é criado no Prisma com campos: id, conversationId, userId, content, role (USER/ASSISTANT), createdAt
9. **And** o chat input é auto-expanding (1-4 linhas), com Shift+Enter para nova linha
10. **And** focus automático no input ao abrir o chat
11. **And** placeholder contextual: "Posez votre question au spécialiste..."
12. **And** layout responsivo: sidebar overlay no mobile (< 1024px), sidebar fixa no desktop (>= 1024px)
13. **And** DisclaimerBanner visível na base do chat: "Je suis une IA spécialisée et ne remplace pas un professionnel certifié."
14. **And** acessibilidade: mensagens com role="listitem", aria-live para novas mensagens, focus management

## Tasks / Subtasks

- [ ] Task 1: Instalar dependências (AC: todos)
  - [ ] 1.1 Instalar Zustand: `npm install zustand`
  - [ ] 1.2 Instalar SWR (para data fetching futuro): `npm install swr`
  - [ ] 1.3 Verificar que Prisma models Conversation e Message JÁ EXISTEM no schema

- [ ] Task 2: Criar Zustand chat-store (AC: #4, #5, #6)
  - [ ] 2.1 Criar `src/stores/chat-store.ts`:
    ```typescript
    import { create } from 'zustand';

    interface Message {
      id: string;
      conversationId: string;
      content: string;
      role: 'USER' | 'ASSISTANT';
      createdAt: Date;
    }

    interface ChatState {
      messages: Message[];
      isStreaming: boolean;
      currentConversationId: string | null;
      addMessage: (message: Message) => void;
      appendToLastMessage: (token: string) => void;
      setStreaming: (status: boolean) => void;
      setConversation: (id: string | null) => void;
      setMessages: (messages: Message[]) => void;
      reset: () => void;
    }

    export const useChatStore = create<ChatState>((set) => ({
      messages: [],
      isStreaming: false,
      currentConversationId: null,
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),
      appendToLastMessage: (token) => set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'ASSISTANT') {
          msgs[msgs.length - 1] = { ...last, content: last.content + token };
        }
        return { messages: msgs };
      }),
      setStreaming: (status) => set({ isStreaming: status }),
      setConversation: (id) => set({ currentConversationId: id }),
      setMessages: (messages) => set({ messages }),
      reset: () => set({ messages: [], isStreaming: false, currentConversationId: null }),
    }));
    ```
  - [ ] 2.2 Criar `src/stores/ui-store.ts` para estado da sidebar:
    ```typescript
    import { create } from 'zustand';

    interface UiState {
      sidebarOpen: boolean;
      toggleSidebar: () => void;
      setSidebarOpen: (open: boolean) => void;
    }

    export const useUiStore = create<UiState>((set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }));
    ```

- [ ] Task 3: Criar Zod schemas de validação (AC: #4, #7, #8)
  - [ ] 3.1 Criar `src/lib/validations/chat.ts`:
    ```typescript
    import { z } from 'zod';

    export const createConversationSchema = z.object({
      specialistId: z.string().min(1, 'Specialist ID is required'),
    });

    export const sendMessageSchema = z.object({
      conversationId: z.string().min(1, 'Conversation ID is required'),
      content: z.string().min(1, 'Le message ne peut pas être vide').max(4000, 'Message trop long'),
    });

    export type CreateConversationInput = z.infer<typeof createConversationSchema>;
    export type SendMessageInput = z.infer<typeof sendMessageSchema>;
    ```

- [ ] Task 4: Criar Server Actions para chat (AC: #4, #7, #8)
  - [ ] 4.1 Criar `src/actions/chat-actions.ts`:
    - Action `createConversation(input)`:
      1. Auth check via `auth()`
      2. Validação Zod com `createConversationSchema`
      3. Verificar que specialist existe
      4. Criar Conversation no Prisma
      5. Retornar `{ success: true, data: { conversationId } }`
    - Action `sendMessage(input)`:
      1. Auth check via `auth()`
      2. Validação Zod com `sendMessageSchema`
      3. Verificar ownership da conversation
      4. Criar Message no Prisma com role: 'USER'
      5. Retornar `{ success: true, data: { message } }`
    - Action `deleteConversation(conversationId)`:
      1. Auth check
      2. Verificar ownership
      3. Soft delete: `isDeleted: true`
      4. Retornar `{ success: true }`

- [ ] Task 5: Implementar layout dashboard com sidebar (AC: #1, #2, #12)
  - [ ] 5.1 Atualizar `src/app/(dashboard)/layout.tsx`:
    - Sidebar colapsável (280px) com `useUiStore`
    - Main area flex-1
    - Header com botão hamburger (mobile) e UserMenu
    - Sidebar: avatar do especialista, botão "+ Nouvelle conversation", lista de conversas
    - Usar componente ShadCN `Sidebar` já instalado
    - Mobile (< 1024px): sidebar como Sheet/overlay com backdrop blur
    - Desktop (>= 1024px): sidebar fixa
  - [ ] 5.2 Criar `src/components/chat/conversation-sidebar.tsx` (Client Component):
    - Avatar do especialista no topo
    - Botão "+ Nouvelle conversation" (primário)
    - Lista de conversas com título e data
    - Conversas em ordem cronológica reversa
    - Item ativo com background accent
    - `nav` semântico com `aria-label="Navigation principale"`
  - [ ] 5.3 Criar `src/components/chat/conversation-list.tsx` (Client Component):
    - Renderizar lista de conversas
    - Cada item: título (truncado) + data relativa
    - Click handler para navegar para `/chat/[conversationId]`
    - Usar `ScrollArea` ShadCN para scroll interno

- [ ] Task 6: Criar página de chat (AC: #1, #3, #6, #10, #11, #13)
  - [ ] 6.1 Criar `src/app/(dashboard)/chat/page.tsx` (Server Component):
    - Auth check com `auth()` → redirect se não autenticado
    - Buscar conversas do usuário no Prisma (para sidebar)
    - Buscar especialista ativo do usuário (via Subscription)
    - Se nenhuma conversa: exibir welcome state
    - Se conversas existem: exibir a mais recente
    - `generateMetadata`: title "Chat - Ultra IA"
  - [ ] 6.2 Criar `src/app/(dashboard)/chat/[conversationId]/page.tsx` (Server Component):
    - Auth check + ownership check da conversation
    - Carregar mensagens da conversa do Prisma
    - Passar mensagens para o Client Component
    - `generateMetadata`: title dinâmico com nome do especialista

- [ ] Task 7: Criar componente ChatMessage (AC: #4, #14)
  - [ ] 7.1 Criar `src/components/chat/chat-message.tsx`:
    - Props: `message: { role, content, createdAt }`, `specialistName`, `specialistColor`
    - Variante USER: bolha com `bg-primary text-primary-foreground`, alinhada à direita
    - Variante ASSISTANT: bolha com `bg-muted`, alinhada à esquerda, avatar do especialista
    - Timestamp relativo (ex: "il y a 2 min")
    - `role="listitem"`, `aria-label` com remetente e horário
    - Max-width 480px para bolhas
    - Suporte markdown básico no conteúdo (futuro: Story 4.2)

- [ ] Task 8: Criar componente StreamingIndicator (AC: #5)
  - [ ] 8.1 Criar `src/components/chat/streaming-indicator.tsx`:
    - Avatar do especialista (36px) + 3 dots animados em bolha
    - Alinhado à esquerda (como mensagem assistant)
    - CSS animation para dots: scale + opacity cycling
    - `aria-live="polite"`, `aria-label="Le spécialiste est en train de répondre"`
    - Respeitar `prefers-reduced-motion` — sem animação se preferido
    - Visível apenas quando `useChatStore.isStreaming === true`

- [ ] Task 9: Criar componente ChatInput (AC: #4, #9, #10, #11)
  - [ ] 9.1 Criar `src/components/chat/chat-input.tsx` (Client Component):
    - Textarea auto-expanding (1 linha min, 4 linhas max)
    - Enter para enviar, Shift+Enter para nova linha
    - Botão enviar (ícone SendHorizontal de lucide-react)
    - Placeholder: "Posez votre question au spécialiste..."
    - Focus automático com `useRef` + `useEffect`
    - Disabled quando `isStreaming === true`
    - Loading state no botão durante envio
    - `aria-label="Envoyer un message"`
    - Altura fixa na base da área de chat (position sticky/fixed)

- [ ] Task 10: Criar componente QuickPrompt (AC: #3)
  - [ ] 10.1 Atualizar/reutilizar `src/components/specialist/quick-prompt.tsx` (já existe):
    - O componente já existe com emoji + texto
    - Adicionar `onClick` handler para inserir texto no chat input
    - 3 quick prompts exibidos na welcome message
    - Grid layout (> 640px) ou scroll horizontal (< 640px)
    - `role="button"`, `aria-label` descritivo

- [ ] Task 11: Criar componente DisclaimerBanner (AC: #13)
  - [ ] 11.1 Criar `src/components/shared/disclaimer-banner.tsx`:
    - Ícone info + texto: "Je suis une IA spécialisée et ne remplace pas un professionnel certifié."
    - Fixo na base da área de chat, acima do input
    - Estilo sutil: text-xs, text-muted-foreground, bg-muted/50
    - `role="complementary"`, `aria-label="Aviso legal"`
    - Opcional: link "En savoir plus" para `/terms`

- [ ] Task 12: Criar componente ChatArea (AC: #3, #4, #5, #6, #14)
  - [ ] 12.1 Criar `src/components/chat/chat-area.tsx` (Client Component):
    - Container principal para mensagens + input
    - ScrollArea para mensagens com auto-scroll
    - Auto-scroll desativado quando usuário faz scroll manual
    - Exibir welcome message + QuickPrompts se conversa vazia
    - Exibir ChatMessages da conversa atual
    - Exibir StreamingIndicator quando `isStreaming`
    - DisclaimerBanner fixo acima do ChatInput
    - ChatInput fixo na base
    - `aria-live="polite"` para novas mensagens
    - Welcome message: avatar do especialista + "Bonjour ! Je suis votre spécialiste en [domaine]. Comment puis-je vous aider ?"

- [ ] Task 13: Responsividade e Dark Mode (AC: #12)
  - [ ] 13.1 Desktop (>= 1024px): sidebar 280px fixa + chat area flexível
  - [ ] 13.2 Tablet (640px - 1024px): sidebar colapsável overlay + chat full-width
  - [ ] 13.3 Mobile (< 640px): sidebar via hamburger menu + chat full-width + input fixo na base
  - [ ] 13.4 Quick prompts: grid >= 640px, scroll horizontal < 640px
  - [ ] 13.5 Dark mode: usar CSS custom properties (bg-card, bg-muted, text-foreground, etc.)
  - [ ] 13.6 Sidebar: backdrop blur quando overlay

- [ ] Task 14: Validação final (AC: todos)
  - [ ] 14.1 `npm run lint` sem erros
  - [ ] 14.2 `npx tsc --noEmit` sem erros TypeScript
  - [ ] 14.3 Testar criar conversa: Conversation criada no Prisma
  - [ ] 14.4 Testar enviar mensagem: Message criada com role USER
  - [ ] 14.5 Testar auto-scroll quando nova mensagem
  - [ ] 14.6 Testar Enter para enviar, Shift+Enter para nova linha
  - [ ] 14.7 Testar welcome message com quick prompts na conversa vazia
  - [ ] 14.8 Testar sidebar: toggle, conversas listadas, navegar entre conversas
  - [ ] 14.9 Testar responsividade: desktop, tablet, mobile
  - [ ] 14.10 Testar dark mode na interface de chat
  - [ ] 14.11 Verificar acessibilidade: keyboard navigation, ARIA attributes, focus management
  - [ ] 14.12 Testar disclaimer banner visível

## Dev Notes

### Pré-requisitos (Stories Anteriores)

Esta story depende das stories de autenticação e assinatura:

**Da Story 2.1 (in-progress):**
- Auth.js v5 com `auth()` helper
- SessionProvider, middleware de proteção de rotas
- Prisma configurado com User, Account, Session

**Da Story 2.2 (ready-for-dev):**
- Login/logout funcional, UserMenu no header

**Da Story 3.1 (ready-for-dev):**
- Subscription model no Prisma
- Stripe checkout funcional

**Da Story 3.3 (ready-for-dev):**
- Subscription gating via middleware (protege /chat para assinantes)

**NOTA PARA DESENVOLVIMENTO:** Se Stories 2.x e 3.x ainda não estiverem implementadas, o dev pode acessar /chat diretamente (sem middleware ativo) para testar. O middleware protegerá as rotas quando implementado.

### Estado Atual do Codebase (Chat-Related)

| Componente | Status | Ação Nesta Story |
|---|---|---|
| `prisma/schema.prisma` | Conversation + Message + MessageRole definidos | Sem alteração — usar modelos existentes |
| `src/app/(dashboard)/layout.tsx` | Placeholder (flex básico) | **Implementar layout completo com sidebar** |
| `src/app/(dashboard)/chat/` | Não existe | **Criar página de chat** |
| `src/components/chat/` | Diretório vazio (.gitkeep) | **Criar todos os componentes de chat** |
| `src/stores/` | Diretório vazio (.gitkeep) | **Criar chat-store + ui-store** |
| `src/actions/` | .gitkeep ou auth-actions (Story 2.1) | **Criar chat-actions.ts** |
| `src/lib/validations/` | auth.ts (Story 2.1) | **Criar chat.ts** |
| `src/lib/n8n.ts` | Placeholder | NÃO tocar (Story 4.2) |
| `src/components/specialist/quick-prompt.tsx` | Existe (landing page) | **Estender com onClick** |
| `src/hooks/use-mobile.ts` | Existe | Reutilizar para responsividade |
| `package.json` | Sem zustand, sem swr | **Instalar zustand + swr** |

### Prisma Models (Já Existem — NÃO Criar)

```prisma
model Conversation {
  id           String     @id @default(cuid())
  title        String?
  userId       String
  specialistId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  isDeleted    Boolean    @default(false)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  specialist   Specialist @relation(fields: [specialistId], references: [id])
  messages     Message[]
  @@index([userId, createdAt])
  @@index([specialistId])
  @@map("conversations")
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  userId         String
  content        String       @db.Text
  role           MessageRole  @default(USER)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([conversationId, createdAt])
  @@map("messages")
}

enum MessageRole {
  USER
  ASSISTANT
}
```

### Padrões de Arquitetura Obrigatórios

- **State Management:** Zustand 5.x — stores: `chat-store.ts`, `ui-store.ts`
- **Data Fetching:** SWR 2.x para listas de conversas (revalidação automática)
- **Streaming:** SSE via ReadableStream (Story 4.2, NÃO nesta story)
- **Server Action Pattern:** auth → validate → authorize → execute
- **API Response Pattern:** `{ success: true, data }` ou `{ success: false, error: { code, message } }`
- **Error Codes:** `AUTH_REQUIRED` (401), `NOT_FOUND` (404), `VALIDATION_ERROR` (400)
- **Import Order:** React/Next → Libs externas → Components (@/) → Lib/utils → Types → Stores
- **Naming:** PascalCase (componentes), kebab-case (ficheiros), camelCase (funções/vars)
- **Idioma UI:** Francês
- **Componentes:** kebab-case.tsx → PascalCase export

### Layout do Chat — ASCII Mockup

```
┌──────────────────────────────────────────────────────────────┐
│  Header (UserMenu, logo, hamburger mobile)                    │
├────────────────┬─────────────────────────────────────────────┤
│  Sidebar 280px │  Chat Area                                   │
│                │                                              │
│  [Avatar]      │  ┌─────────────────────────────────────┐    │
│  Expert Gestion│  │ 👤 Bonjour ! Je suis votre          │    │
│                │  │    spécialiste en Gestion             │    │
│  [+ Nouvelle   │  │    d'Entreprise. Comment puis-je     │    │
│   conversation]│  │    vous aider ?                       │    │
│                │  └─────────────────────────────────────┘    │
│  ─────────────── │                                            │
│  📝 Stratégie... │  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  📝 Comment au...│  │💡 Comment │ │📊 Analyser│ │🎯 Définir│  │
│  📝 Négocier ... │  │augmenter  │ │mes coûts  │ │ma strat. │  │
│                │  │mon CA ?   │ │opérat. ? │ │commerc. │  │
│                │  └──────────┘ └──────────┘ └──────────┘  │
│                │                                              │
│                │                                              │
│                │  ── ℹ️ Je suis une IA spécialisée... ──     │
│                │  ┌─────────────────────────────────────┐    │
│                │  │ Posez votre question au spécialiste..│ 📤 │
│                │  └─────────────────────────────────────┘    │
└────────────────┴─────────────────────────────────────────────┘
```

### ChatMessage — Variants

```
USER MESSAGE:                                    ASSISTANT MESSAGE:
                     ┌──────────────┐     ┌──────┐──────────────┐
                     │ Message text │     │ 👤   │ Message text │
                     │ il y a 2 min │     │      │ il y a 1 min │
                     └──────────────┘     └──────┘──────────────┘
       (bg-primary, text-primary-fg)       (bg-muted, avatar à esquerda)
         (alinhado à direita)                (alinhado à esquerda)
         (max-width 480px)                   (max-width 480px)
```

### Server Action — createConversation

```typescript
// src/actions/chat-actions.ts
'use server'
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createConversationSchema, sendMessageSchema } from '@/lib/validations/chat';

export async function createConversation(input: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };

  const parsed = createConversationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };

  const specialist = await prisma.specialist.findUnique({ where: { id: parsed.data.specialistId } });
  if (!specialist) return { success: false, error: { code: 'NOT_FOUND', message: 'Spécialiste non trouvé' } };

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      specialistId: specialist.id,
    },
  });

  return { success: true, data: { conversationId: conversation.id } };
}

export async function sendMessage(input: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };

  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } };

  // Ownership check
  const conversation = await prisma.conversation.findUnique({
    where: { id: parsed.data.conversationId, userId: session.user.id, isDeleted: false },
  });
  if (!conversation) return { success: false, error: { code: 'NOT_FOUND', message: 'Conversation non trouvée' } };

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      userId: session.user.id,
      content: parsed.data.content,
      role: 'USER',
    },
  });

  // Auto-generate title from first message if no title yet
  if (!conversation.title) {
    const title = parsed.data.content.slice(0, 60) + (parsed.data.content.length > 60 ? '...' : '');
    await prisma.conversation.update({ where: { id: conversation.id }, data: { title } });
  }

  return { success: true, data: { message } };
}

export async function deleteConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId: session.user.id },
  });
  if (!conversation) return { success: false, error: { code: 'NOT_FOUND', message: 'Conversation non trouvée' } };

  await prisma.conversation.update({ where: { id: conversationId }, data: { isDeleted: true } });

  return { success: true };
}
```

### SSE Streaming — Preparação para Story 4.2

```
Data Flow (completo, implementado em Story 4.2):

Client → POST /api/chat/stream (message + conversationId)
  → Server valida auth + rate limit + subscription
  → Server chama N8N webhook (HTTP POST)
  → N8N processa via GPT 5.2
  → N8N retorna stream → Server proxy via SSE (ReadableStream)
  → Client recebe tokens word-by-word via EventSource
  → useChatStore.appendToLastMessage(token)
  → Server persiste mensagem completa no DB ao finalizar stream

NESTA STORY (4.1):
- Criar a infra do chat-store com appendToLastMessage
- Criar StreamingIndicator component
- NÃO implementar SSE/N8N (Story 4.2)
- Após user enviar mensagem, mostrar StreamingIndicator como placeholder
```

### Dashboard Layout — Componente ShadCN Sidebar

O componente `Sidebar` ShadCN já está instalado em `src/components/ui/sidebar.tsx`. Reutilizar para o dashboard layout:

```typescript
// src/app/(dashboard)/layout.tsx
import { SidebarProvider } from '@/components/ui/sidebar';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ConversationSidebar />
      <main className="flex-1 flex flex-col">{children}</main>
    </SidebarProvider>
  );
}
```

### QuickPrompt — Componente Existente

O `QuickPrompt` já existe em `src/components/specialist/quick-prompt.tsx`:
```typescript
export function QuickPrompt({ prompt }: QuickPromptProps) {
  return (
    <div
      role="listitem"
      className="rounded-md border bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {prompt}
    </div>
  );
}
```

**Modificação necessária:** Adicionar prop `onClick` para enviar o prompt como mensagem no chat. Manter `role="button"` em vez de `role="listitem"` quando usado no chat.

### Welcome Message — Dados do Specialist

O specialist no seed tem quick prompts:
```typescript
// prisma/seed.ts
quickPrompts: [
  '💡 Comment augmenter mon chiffre d\'affaires ?',
  '📊 Comment analyser mes coûts opérationnels ?',
  '🎯 Comment définir ma stratégie commerciale ?',
],
```

A welcome message usa dados do specialist:
- Nome: `specialist.name`
- Domínio: `specialist.domain`
- Quick prompts: `specialist.quickPrompts`
- Accent color: `specialist.accentColor`

### Componentes ShadCN Reutilizados

| Componente | Localização | Uso nesta Story |
|---|---|---|
| `Sidebar` | `components/ui/sidebar.tsx` | Layout dashboard com conversation sidebar |
| `ScrollArea` | `components/ui/scroll-area.tsx` | Scroll de mensagens no chat |
| `Button` | `components/ui/button.tsx` | "+ Nouvelle conversation", enviar mensagem |
| `Avatar` | `components/ui/avatar.tsx` | Avatar do especialista e usuário |
| `Textarea` | `components/ui/textarea.tsx` | Base para ChatInput auto-expanding |
| `Sheet` | `components/ui/sheet.tsx` | Sidebar overlay no mobile |
| `Skeleton` | `components/ui/skeleton.tsx` | Loading state das mensagens |
| `Separator` | `components/ui/separator.tsx` | Separadores na sidebar |
| `Toaster/toast` | `components/ui/sonner.tsx` | Toast para erros |
| `Tooltip` | `components/ui/tooltip.tsx` | Dicas em botões (enviar, nova conversa) |

### Dependências a Instalar

```bash
# State management
npm install zustand

# Data fetching (para futuro, instalar agora)
npm install swr
```

**Zustand v5.0.10** (latest, janeiro 2026) — 1.16KB gzipped, sem Provider wrapper, compatible com React 19 concurrent rendering via `useSyncExternalStore`.

### useIsMobile Hook (Já Existe)

O hook `useIsMobile` já existe em `src/hooks/use-mobile.ts`. Reutilizar para detectar mobile e controlar sidebar behavior:
- Mobile: sidebar via Sheet (overlay)
- Desktop: sidebar fixa

### Auto-Scroll Logic

```typescript
// No ChatArea component:
const scrollRef = useRef<HTMLDivElement>(null);
const [autoScroll, setAutoScroll] = useState(true);

// Auto-scroll quando novas mensagens
useEffect(() => {
  if (autoScroll && scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [messages, autoScroll]);

// Desativar auto-scroll quando user faz scroll manual
function handleScroll(e: React.UIEvent) {
  const el = e.currentTarget;
  const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  setAutoScroll(isAtBottom);
}
```

### Project Structure Notes

- Chat components em `src/components/chat/` — ficheiro por componente
- Dashboard layout atualizado em `src/app/(dashboard)/layout.tsx`
- Zustand stores em `src/stores/` — chat-store.ts + ui-store.ts
- Server actions em `src/actions/chat-actions.ts`
- Validações em `src/lib/validations/chat.ts`
- DisclaimerBanner em `src/components/shared/` (compartilhado, não específico do chat)
- Quick prompt existente em `src/components/specialist/` — estender, não duplicar

### Guardrails — O Que NÃO Fazer

- **NÃO** implementar SSE streaming / N8N integration — é Story 4.2
- **NÃO** implementar histórico completo com busca/infinite scroll — é Story 4.3
- **NÃO** implementar rate limiting — é Story 4.4
- **NÃO** implementar controle de escopo da IA — é Story 4.4
- **NÃO** implementar armazenamento anônimo RGPD — é Story 4.5
- **NÃO** criar modelos Conversation/Message no Prisma — JÁ EXISTEM
- **NÃO** criar API Route `/api/chat/stream` — é Story 4.2
- **NÃO** criar `src/lib/n8n.ts` — é Story 4.2
- **NÃO** instalar EventSource/polyfill — é Story 4.2
- **NÃO** duplicar QuickPrompt — estender o existente com onClick
- **NÃO** esquecer `'use client'` nos componentes interativos
- **NÃO** esquecer `'use server'` nos server actions
- **NÃO** usar React Context para estado global — usar Zustand
- **NÃO** esquecer auto-scroll com desativação por scroll manual
- **NÃO** esquecer `aria-live="polite"` para novas mensagens
- **NÃO** esquecer `prefers-reduced-motion` no StreamingIndicator
- **NÃO** esquecer soft delete (isDeleted) ao deletar conversas
- **NÃO** hardcodar texto em inglês — TODO o UI em francês
- **NÃO** esquecer ownership check nas server actions (userId da session vs userId da conversation)

### Ficheiros a Criar/Modificar

```
NOVOS:
src/stores/chat-store.ts                              # Zustand chat state
src/stores/ui-store.ts                                # Zustand UI state (sidebar)
src/lib/validations/chat.ts                           # Zod schemas (conversation, message)
src/actions/chat-actions.ts                           # Server Actions (create, send, delete)
src/components/chat/chat-message.tsx                  # Message bubble (user/assistant)
src/components/chat/streaming-indicator.tsx            # AI typing indicator
src/components/chat/chat-input.tsx                    # Auto-expanding textarea + send
src/components/chat/chat-area.tsx                     # Main chat area (messages + input)
src/components/chat/conversation-sidebar.tsx           # Sidebar com conversas
src/components/chat/conversation-list.tsx              # Lista de conversas
src/components/shared/disclaimer-banner.tsx            # Disclaimer legal
src/app/(dashboard)/chat/page.tsx                     # Chat page (Server Component)
src/app/(dashboard)/chat/[conversationId]/page.tsx    # Conversation page (Server Component)

MODIFICADOS:
src/app/(dashboard)/layout.tsx                        # Dashboard layout com sidebar
src/components/specialist/quick-prompt.tsx             # Adicionar onClick handler
package.json                                          # zustand + swr (via npm install)
```

### Dependências entre Stories

| Story | Relação | Impacto |
|---|---|---|
| 1.1 (done) | Pré-requisito | Design system, Prisma, ShadCN, estrutura |
| 2.1 (in-progress) | **Pré-requisito** | Auth.js v5, auth(), SessionProvider |
| 2.2 (ready-for-dev) | **Pré-requisito** | Login funcional, UserMenu |
| 3.1 (ready-for-dev) | Paralela | Subscription model (necessário para verificar acesso) |
| 3.3 (ready-for-dev) | Paralela | Subscription gating protege /chat |
| 4.2 (ready-for-dev) | **Dependente** | SSE streaming + N8N usa infra criada aqui |
| 4.3 (ready-for-dev) | **Dependente** | Histórico completo usa sidebar/lista criados aqui |
| 4.4 (ready-for-dev) | **Dependente** | Rate limiting + disclaimers usa components criados aqui |
| 4.5 (ready-for-dev) | **Dependente** | RGPD usa conversation/message models usados aqui |

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.1 Acceptance Criteria, Epic 4 Overview, Cross-Story Dependencies]
- [Source: _bmad-output/planning-artifacts/architecture.md — SSE Streaming Flow, Zustand Store Pattern, Chat Component Structure, Server Action Pattern, API Routes, Error Codes, Data Flow, Environment Variables, Naming Conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Chat Interface Design, ChatMessage/StreamingIndicator/QuickPrompt/DisclaimerBanner Specs, Keyboard Shortcuts, Sidebar Design, Welcome Message Flow, User Journeys, Responsive Design, Dark Mode, Accessibility, Loading States]
- [Source: _bmad-output/planning-artifacts/prd.md — FR18-FR28 (Chat Requirements), NFR1 (First Token < 5s), NFR4 (History < 1s), User Journeys (Pierre, Marie)]
- [Source: prisma/schema.prisma — Conversation, Message, MessageRole Models]
- [Source: src/components/specialist/quick-prompt.tsx — Existing QuickPrompt Component]
- [Source: src/hooks/use-mobile.ts — Existing useIsMobile Hook]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Story é a fundação do chat — core experience da plataforma
- Prisma Conversation + Message models JÁ EXISTEM — não duplicar
- Zustand v5.0.10 para state management (chat-store + ui-store)
- SWR instalado proativamente para Story 4.3 (conversation history)
- StreamingIndicator criado como visual component — SSE real é Story 4.2
- appendToLastMessage no chat-store prepara para token-by-token streaming (Story 4.2)
- QuickPrompt já existe — estender com onClick, não duplicar
- useIsMobile hook já existe — reutilizar para responsividade sidebar
- ShadCN Sidebar component já instalado — reutilizar para dashboard layout
- Auto-scroll com desativação por scroll manual
- Soft delete para conversas (isDeleted flag) preparado para RGPD
- Auto-generate title da conversa a partir da primeira mensagem
- Todo conteúdo UI em francês: welcome message, placeholder, disclaimer, timestamps
- Ownership check em todas server actions (userId da session vs conversation)
- DisclaimerBanner em src/components/shared/ (reutilizável fora do chat)

### File List
