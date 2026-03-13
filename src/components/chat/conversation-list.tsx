'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquare, Trash2 } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from '@/hooks/use-conversations';

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentConversationId?: string;
  // HIGH-3 fix: expose delete callback so sidebar can revalidate SWR after deletion (AC12)
  onDelete?: (id: string) => Promise<void>;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onDelete,
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-xs text-muted-foreground">
        Aucune conversation
      </div>
    );
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ScrollArea className="flex-1">
      <ul className="space-y-1 px-2 py-1" role="list" aria-label="Conversations">
        {conversations.map((conversation) => {
          const isActive = currentConversationId === conversation.id;
          const title = conversation.title ?? 'Nouvelle conversation';
          const timeAgo = formatDistanceToNow(new Date(conversation.updatedAt), {
            addSuffix: true,
            locale: fr,
          });
          const isDeleting = deletingId === conversation.id;

          return (
            <li key={conversation.id} role="listitem" className="group relative">
              <Link
                href={`/chat/${conversation.id}`}
                className={cn(
                  'flex items-start gap-2 rounded-md px-2 py-2 pr-8 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground font-medium',
                  isDeleting && 'opacity-50 pointer-events-none',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <MessageSquare
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-snug">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo}</p>
                </div>
              </Link>
              {onDelete && (
                <button
                  onClick={(e) => handleDelete(e, conversation.id)}
                  disabled={isDeleting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                  aria-label={`Supprimer la conversation ${title}`}
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
