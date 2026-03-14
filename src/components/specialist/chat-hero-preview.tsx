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
      className="hero-card w-full max-w-md"
    >
      {/* Decorative SVG path */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-8 -top-8 h-[60%] w-[280px] opacity-15"
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
      <div className="relative z-10 flex items-center gap-3 glass-dark px-4 py-3">
        <Avatar className="h-8 w-8 ring-2 ring-primary/60">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            EG
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white">Expert Gestion</p>
          <p className="text-xs text-white/60">{t.landing.online}</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="relative z-10 flex h-[320px] flex-col gap-3 overflow-hidden bg-background/90 p-4">
        {messages.slice(0, displayCount).map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm transition-opacity duration-300 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
