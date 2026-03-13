'use client';

import { useCallback } from 'react';

import { useChatStore, type Message } from '@/stores/chat-store';
import { useStreaming } from '@/hooks/use-streaming';

export function useChat(conversationId: string) {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const { startStream, abort, error } = useStreaming();

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      // Optimistic update — add user message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'USER',
        content: content.trim(),
        createdAt: new Date(),
      };
      useChatStore.getState().addMessage(userMessage);

      await startStream(conversationId, content.trim());
    },
    [conversationId, isStreaming, startStream]
  );

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    error,
    abort,
  };
}
