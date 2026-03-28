'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useChatStore } from '@/stores/chat-store';

export function useStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const startStream = useCallback(async (conversationId: string, content: string) => {
    setError(null);
    setIsStreaming(true);
    useChatStore.getState().setStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 429) {
        setError("Vous avez atteint la limite quotidienne.");
        setIsStreaming(false);
        useChatStore.getState().setStreaming(false);
        return;
      }

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        const message = data?.error?.message ?? 'Erreur lors de la connexion au spécialiste.';
        setError(message);
        useChatStore.getState().setStreaming(false);
        return;
      }

      if (!response.body) {
        setError('Stream body unavailable');
        useChatStore.getState().setStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr) as {
              token?: string;
              done?: boolean;
              error?: string;
            };

            if (data.error) {
              setError(data.error);
              useChatStore.getState().setStreaming(false);
              return;
            }

            if (data.token !== undefined && !data.done) {
              useChatStore.getState().appendStreamToken(data.token);
            }

            if (data.done) {
              useChatStore.getState().finalizeStreamingMessage();
            }
          } catch {
            // ignore JSON parse errors from malformed lines
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        useChatStore.getState().setStreaming(false);
        return;
      }
      setError('Erreur de connexion. Veuillez réessayer.');
      useChatStore.getState().setStreaming(false);
    } finally {
      setIsStreaming(false);
      useChatStore.getState().setStreaming(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { startStream, abort, isStreaming, error };
}
