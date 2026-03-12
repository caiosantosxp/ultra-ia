'use client';

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mockMessages = [
  { role: 'user' as const, content: 'Comment améliorer la rentabilité de ma PME ?' },
  {
    role: 'assistant' as const,
    content:
      "Avant de vous conseiller, j'ai quelques questions pour comprendre votre situation :",
  },
  {
    role: 'assistant' as const,
    content:
      "📊 Quel est votre chiffre d'affaires annuel ?\n👥 Combien d'employés avez-vous ?\n🏭 Quel est votre secteur d'activité ?",
  },
  { role: 'user' as const, content: '500K€, 8 employés, services B2B' },
  {
    role: 'assistant' as const,
    content: 'Excellent ! Voici 3 leviers prioritaires pour votre profil...',
  },
];

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

export function ChatHeroPreview() {
  const reducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayCount = reducedMotion ? mockMessages.length : visibleCount;

  useEffect(() => {
    if (reducedMotion) return;

    if (visibleCount < mockMessages.length) {
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
  }, [visibleCount, reducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="w-full max-w-md overflow-hidden rounded-xl border bg-surface shadow-2xl"
    >
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar className="h-8 w-8 ring-2 ring-primary">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            EG
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">Expert Gestion</p>
          <p className="text-xs text-muted-foreground">En ligne</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex h-[320px] flex-col gap-3 overflow-hidden p-4">
        {mockMessages.slice(0, displayCount).map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm transition-opacity duration-300 ${
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
