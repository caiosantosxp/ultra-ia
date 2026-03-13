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
        'flex items-end gap-2',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <Avatar className="h-9 w-9 shrink-0 self-end">
          <AvatarImage src={specialistAvatarUrl} alt={specialistName} />
          <AvatarFallback className="text-xs">
            {specialistName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {isUser && userAvatarUrl && (
        <Avatar className="h-9 w-9 shrink-0 self-end">
          <AvatarImage src={userAvatarUrl} alt={userName ?? 'Vous'} />
          <AvatarFallback className="text-xs">
            {(userName ?? 'V').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'flex max-w-[480px] flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'rounded-bl-sm bg-muted text-foreground'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <time
          dateTime={new Date(message.createdAt).toISOString()}
          className="px-1 text-xs text-muted-foreground"
        >
          {timeAgo}
        </time>
      </div>
    </li>
  );
}
