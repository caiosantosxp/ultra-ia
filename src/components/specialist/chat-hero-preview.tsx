'use client';

import { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useT } from '@/lib/i18n/use-t';

const MOCK_ROLES: ('user' | 'assistant')[] = [
  'user',
  'assistant',
  'assistant',
  'user',
  'assistant',
];

/**
 * NexAgent Design System — Chat Hero Preview
 *
 * Glassmorphism chat preview with animated messages
 */
export function ChatHeroPreview() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = t.landing.previewMessages.map((content, i) => ({
    role: MOCK_ROLES[i],
    content,
  }));

  const displayCount = reducedMotion ? messages.length : visibleCount;

  useEffect(() => {
    if (reducedMotion) return;

    if (visibleCount < messages.length) {
      timeoutRef.current = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, 1500);
    } else {
      timeoutRef.current = setTimeout(() => {
        setVisibleCount(0);
      }, 3000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visibleCount, reducedMotion, messages.length]);

  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
    >
      {/* Decorative gradient border glow */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-[24px] opacity-50"
        style={{
          background:
            'linear-gradient(135deg, rgba(3,103,251,0.3) 0%, rgba(51,233,191,0.2) 50%, rgba(198,235,0,0.1) 100%)',
        }}
      />

      {/* Decorative SVG path */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-8 -top-8 h-[60%] w-[280px] opacity-10"
          preserveAspectRatio="none"
          viewBox="0 0 780 1140"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: 'scaleX(-1)' }}
        >
          <path
            className="animate-[drawPath_2.5s_ease-out_0.5s_forwards]"
            d="M 555 0 C -514.95 653.314 502.942 726.558 720 509.5 C 937.058 292.442 174.231 575.033 381 1140"
            fill="transparent"
            stroke="white"
            strokeDasharray="2420"
            strokeDashoffset="2420"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Chat header — glass dark */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-[#041c40]/90 px-5 py-4 backdrop-blur-xl">
        <Avatar className="h-10 w-10 ring-2 ring-[#0367fb]/60">
          <AvatarFallback className="bg-gradient-to-br from-[#0367fb] to-[#33e9bf] text-sm font-bold text-white">
            EG
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">Expert Gestion</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#33e9bf]" />
            <p className="text-xs text-white/60">{t.landing.online}</p>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="relative z-10 flex h-[320px] flex-col gap-3 overflow-hidden bg-[#0a1f3d]/95 p-5 backdrop-blur-sm">
        {messages.slice(0, displayCount).map((msg, i) => (
          <div
            key={i}
            className={`flex animate-[fadeSlide_0.3s_ease-out] ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-br-md bg-[#0367fb] text-white'
                  : 'rounded-bl-md border border-white/10 bg-white/10 text-white/90'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {displayCount > 0 && displayCount < messages.length && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/10 px-4 py-3">
              <span className="h-2 w-2 animate-[typingBounce_1s_ease-in-out_infinite] rounded-full bg-[#33e9bf]" />
              <span className="h-2 w-2 animate-[typingBounce_1s_ease-in-out_0.2s_infinite] rounded-full bg-[#33e9bf]" />
              <span className="h-2 w-2 animate-[typingBounce_1s_ease-in-out_0.4s_infinite] rounded-full bg-[#33e9bf]" />
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="relative z-10 border-t border-white/10 bg-[#041c40]/90 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-sm text-white/40">{t.landing.typePlaceholder || 'Type a message...'}</span>
        </div>
      </div>
    </div>
  );
}
