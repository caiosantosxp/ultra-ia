'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface StreamingIndicatorProps {
  specialistName: string;
  specialistAvatar?: string;
}

export function StreamingIndicator({ specialistName, specialistAvatar }: StreamingIndicatorProps) {
  const reducedMotion = useReducedMotion();

  const initials = specialistName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="flex items-end gap-2"
      role="status"
      aria-live="polite"
      aria-label="Le spécialiste est en train de répondre"
    >
      <Avatar className="h-8 w-8 shrink-0">
        {specialistAvatar && <AvatarImage src={specialistAvatar} alt={specialistName} />}
        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        {reducedMotion ? (
          <span className="text-sm text-muted-foreground">...</span>
        ) : (
          <>
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: '300ms' }}
            />
          </>
        )}
      </div>
    </div>
  );
}
