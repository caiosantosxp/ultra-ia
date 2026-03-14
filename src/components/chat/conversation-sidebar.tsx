'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Search } from 'lucide-react';

import { createConversation, deleteConversation } from '@/actions/chat-actions';
import { useConversations } from '@/hooks/use-conversations';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ConversationList } from '@/components/chat/conversation-list';
import { ConversationListSkeleton } from '@/components/chat/conversation-list-skeleton';
import { useT } from '@/lib/i18n/use-t';

interface ConversationSidebarProps {
  specialistId: string;
  specialistName: string;
  specialistAvatarUrl: string;
  specialistDomain: string;
}

export function ConversationSidebar({
  specialistId,
  specialistName,
  specialistAvatarUrl,
  specialistDomain,
}: ConversationSidebarProps) {
  const router = useRouter();
  const t = useT();
  const pathname = usePathname();
  const currentConversationId = pathname?.match(/^\/chat\/([^/]+)/)?.[1];

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { conversations, hasMore, isLoading, loadMore, mutate } = useConversations();

  // Ctrl+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // IntersectionObserver for infinite scroll (AC6)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) loadMore();
      },
      { threshold: 0.5 },
    );
    const current = bottomRef.current;
    if (current) observer.observe(current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const filteredConversations = searchQuery
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase();
        const titleMatch = (c.title ?? t.sidebar.newConversation).toLowerCase().includes(q);
        const contentMatch = (c.lastMessageSnippet ?? '').toLowerCase().includes(q);
        return titleMatch || contentMatch;
      })
    : conversations;

  async function handleNewConversation() {
    setIsCreating(true);
    try {
      const result = await createConversation({ specialistId });
      if (result.success) {
        await mutate();
        router.push(`/chat/${result.data.conversationId}`);
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    const result = await deleteConversation(conversationId);
    if (result.success) {
      await mutate();
      if (currentConversationId === conversationId) {
        router.push('/chat');
      }
    }
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={specialistAvatarUrl} alt={specialistName} />
              <AvatarFallback className="text-xs">
                {specialistName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{specialistName}</p>
              <p className="truncate text-xs text-muted-foreground">{specialistDomain}</p>
            </div>
          </div>
          <SidebarTrigger className="shrink-0" aria-label={t.sidebar.toggleAria} />
        </div>
      </SidebarHeader>

      <div className="space-y-2 px-3 py-2">
        <Button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="w-full justify-start gap-2"
          size="sm"
          aria-label={t.sidebar.newConversation}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isCreating ? t.sidebar.creating : t.sidebar.newConversation}
        </Button>

        {/* Search bar — Ctrl+K (AC5) */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder={t.sidebar.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
            aria-label={t.sidebar.searchAria}
          />
        </div>
      </div>

      <Separator />

      <SidebarContent>
        <nav aria-label={t.sidebar.navAria} className="flex h-full flex-col">
          {isLoading ? (
            <ConversationListSkeleton />
          ) : (
            <ConversationList
              conversations={filteredConversations}
              currentConversationId={currentConversationId}
              onDelete={handleDeleteConversation}
            />
          )}
          {/* Sentinel for infinite scroll (AC6) */}
          <div ref={bottomRef} className="h-1" aria-hidden="true" />
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
