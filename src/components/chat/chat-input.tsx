'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';

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
  const [isFocused, setIsFocused] = useState(false);
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
    const maxHeight = lineHeight * 4 + 16;
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
    <div className="py-4">
      <div
        className={cn(
          'relative flex items-end rounded-2xl border-2 bg-white shadow-sm transition-all duration-200',
          isFocused
            ? 'border-[#0367fb] shadow-[0_0_0_3px_rgba(3,103,251,0.1)]'
            : 'border-[#e5e7eb] hover:border-[#d1d5db]',
          isDisabled && 'opacity-60'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t.chat.placeholder}
          aria-label={t.chat.write}
          rows={1}
          disabled={isDisabled}
          className={cn(
            'min-h-[52px] flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3.5 text-[15px] text-[#161616] outline-none',
            'placeholder:text-[#9ca3af]',
            'disabled:cursor-not-allowed'
          )}
        />

        <button
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-label={t.chat.send}
          className={cn(
            'mr-2 mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
            canSend
              ? 'bg-[#0367fb] text-white hover:bg-[#0256d4] shadow-sm'
              : 'bg-[#f3f3f3] text-[#9ca3af] cursor-not-allowed'
          )}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
