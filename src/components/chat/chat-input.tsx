'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isStreaming = false, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const t = useT();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea (1–4 rows)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 24;
    const maxHeight = lineHeight * 4 + 16; // 4 lines + padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value]);

  const isDisabled = isStreaming || disabled || isSending;
  const canSend = value.trim().length > 0 && !isDisabled;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void handleSend();
    }
  }

  async function handleSend() {
    const content = value.trim();
    if (!content) return;
    setValue('');
    setIsSending(true);
    try {
      await onSend(content);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="flex items-end gap-2 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t.chat.placeholder}
        aria-label={t.chat.write}
        rows={1}
        disabled={isDisabled}
        className={cn(
          'min-h-[34px] flex-1 resize-none overflow-y-auto rounded-md border bg-background px-3 py-1.5 text-sm outline-none',
          'placeholder:text-muted-foreground',
          'focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      />
      <Button
        onClick={() => void handleSend()}
        disabled={!canSend}
        aria-label={t.chat.send}
        size="icon"
        className="shrink-0"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
