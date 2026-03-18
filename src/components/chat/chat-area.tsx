'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createConversation, sendMessage } from '@/actions/chat-actions';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatMessage } from '@/components/chat/chat-message';
import { DisclaimerBanner } from '@/components/shared/disclaimer-banner';
import { StreamingIndicator } from '@/components/chat/streaming-indicator';
import { UsageMeter } from '@/components/chat/usage-meter';
import { QuickPrompt } from '@/components/specialist/quick-prompt';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStreaming } from '@/hooks/use-streaming';
import { useUsageLimit } from '@/components/chat/usage-meter';
import { useChatStore } from '@/stores/chat-store';
import { useT } from '@/lib/i18n/use-t';

interface PrismaMessage {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: Date;
  conversationId: string;
  userId: string | null;
}

interface Specialist {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string;
  price: number;
  accentColor: string;
  avatarUrl: string;
  tags: string[];
  quickPrompts: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  firstMessage?: string | null;
}

interface ChatAreaProps {
  initialMessages: PrismaMessage[];
  conversationId: string | null;
  specialist: Specialist | null;
}

export function ChatArea({ initialMessages, conversationId, specialist }: ChatAreaProps) {
  const router = useRouter();
  const t = useT();
  const { messages, isStreaming, streamingContent, setMessages, setConversation, addMessage } =
    useChatStore();
  const { startStream } = useStreaming();
  const { isLimitReached } = useUsageLimit();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Sync server-fetched messages into the store on mount / route change
  useEffect(() => {
    setConversation(conversationId);
    setMessages(
      initialMessages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        content: m.content,
        role: m.role,
        createdAt: new Date(m.createdAt),
      }))
    );
  }, [conversationId, initialMessages, setConversation, setMessages]);

  // Auto-scroll when messages or streaming content changes
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isStreaming, autoScroll]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
  }

  const handleSend = useCallback(
    async (content: string) => {
      if (!specialist) return;

      let currentConversationId = activeConversationId;

      // Create conversation if none exists yet
      if (!currentConversationId) {
        const result = await createConversation({ specialistId: specialist.id });
        if (!result.success) {
          toast.error(t.chatArea.createError);
          return;
        }
        currentConversationId = result.data.conversationId;
        setActiveConversationId(currentConversationId);
        setConversation(currentConversationId);
      }

      // Optimistically add user message to store
      addMessage({
        id: crypto.randomUUID(),
        conversationId: currentConversationId,
        content,
        role: 'USER',
        createdAt: new Date(),
      });
      setAutoScroll(true);

      // First-message case: persist to DB before navigating so the conversation
      // page loads with the message already in the database.
      if (!activeConversationId) {
        const msgResult = await sendMessage({ conversationId: currentConversationId, content });
        if (!msgResult.success) {
          toast.error(t.chatArea.sendError);
          return;
        }
        router.push(`/chat/${currentConversationId}`);
        return;
      }

      // Subsequent messages: stream route handles DB persist for user + assistant messages
      void startStream(currentConversationId, content);
    },
    [activeConversationId, specialist, addMessage, setConversation, startStream, router, t]
  );

  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      void handleSend(prompt);
    },
    [handleSend]
  );

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        aria-live="polite"
        aria-label={t.chatArea.messagesArea}
      >
        {isEmpty && specialist ? (
          /* Welcome state */
          <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={specialist.avatarUrl} alt={specialist.name} />
                <AvatarFallback className="text-lg">
                  {specialist.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-base font-semibold">{specialist.name}</h2>
                <p className="text-sm text-muted-foreground">{specialist.domain}</p>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground whitespace-pre-wrap">
                {specialist.firstMessage
                  ? specialist.firstMessage
                  : `${t.chatArea.greeting} ${specialist.domain}${t.chatArea.greetingSuffix}`}
              </p>
            </div>

            {/* Quick prompts */}
            {specialist.quickPrompts.length > 0 && (
              <div
                className="flex w-full max-w-lg gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-x-visible"
                role="list"
                aria-label={t.chatArea.suggestedQuestions}
              >
                {specialist.quickPrompts.slice(0, 3).map((prompt) => (
                  <QuickPrompt key={prompt} prompt={prompt} onClick={handleQuickPrompt} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Messages list */
          <ul
            className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4"
            role="list"
            aria-label={t.chatArea.messageHistory}
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                specialistName={specialist?.name ?? 'Spécialiste'}
                specialistAvatarUrl={specialist?.avatarUrl ?? ''}
              />
            ))}

            {/* Streaming content */}
            {isStreaming && streamingContent && (
              <ChatMessage
                key="streaming"
                message={{
                  id: 'streaming',
                  role: 'ASSISTANT',
                  content: streamingContent,
                  createdAt: new Date(),
                }}
                specialistName={specialist?.name ?? 'Spécialiste'}
                specialistAvatarUrl={specialist?.avatarUrl ?? ''}
              />
            )}

            {/* Streaming indicator (dots animation) */}
            {isStreaming && !streamingContent && specialist && (
              <StreamingIndicator
                specialistName={specialist.name}
                specialistAvatar={specialist.avatarUrl}
              />
            )}
          </ul>
        )}
      </div>

      {/* Disclaimer (AC3) + Input */}
      <div className="shrink-0 border-t bg-background">
        <div className="mx-auto w-full max-w-3xl px-4">
          {isLimitReached && (
            <p className="py-2 text-center text-xs text-destructive" role="alert">
              {t.chatArea.limitReached}
            </p>
          )}
          <ChatInput onSend={handleSend} isStreaming={isStreaming} disabled={!specialist || isLimitReached} />
        </div>
      </div>
    </div>
  );
}
