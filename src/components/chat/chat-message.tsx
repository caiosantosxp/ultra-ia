'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: Date;
  };
  specialistName: string;
  specialistAvatarUrl: string;
  specialistAccentColor?: string;
  userAvatarUrl?: string;
  userName?: string;
}

export function ChatMessage({
  message,
  specialistName,
  specialistAvatarUrl,
  userAvatarUrl,
  userName,
}: ChatMessageProps) {
  const isUser = message.role === 'USER';
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
    locale: fr,
  });
  const senderLabel = isUser ? (userName ?? 'Vous') : specialistName;

  return (
    <li
      role="listitem"
      aria-label={`${senderLabel}, ${timeAgo}`}
      className={cn(
        'flex items-end gap-2.5',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 self-end ring-2 ring-white shadow-sm">
          <AvatarImage src={specialistAvatarUrl} alt={specialistName} />
          <AvatarFallback className="text-xs bg-[#0367fb] text-white font-semibold">
            {specialistName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'flex max-w-[520px] flex-col gap-1.5',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm',
            isUser
              ? 'rounded-br-md bg-[#0367fb] text-white'
              : 'rounded-bl-md bg-white text-[#161616] border border-[#e5e7eb]'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <time
          dateTime={new Date(message.createdAt).toISOString()}
          className="px-2 text-xs text-[#9ca3af]"
        >
          {timeAgo}
        </time>
      </div>
    </li>
  );
}
