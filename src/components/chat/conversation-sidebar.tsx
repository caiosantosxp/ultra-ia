'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronRight, Globe, LogOut, MessageSquare, Plus, Search, Settings, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

import { createConversation, deleteConversation } from '@/actions/chat-actions';
import { useConversations } from '@/hooks/use-conversations';
import { useLanguageStore } from '@/stores/language-store';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ConversationList } from '@/components/chat/conversation-list';
import { ConversationListSkeleton } from '@/components/chat/conversation-list-skeleton';
import { useT } from '@/lib/i18n/use-t';

interface ConversationSidebarProps {
  specialistId?: string;
  specialistName?: string;
  specialistAvatarUrl?: string;
  specialistDomain?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ConversationSidebar({
  specialistId,
  specialistName,
  specialistAvatarUrl,
  specialistDomain,
  user,
}: ConversationSidebarProps) {
  const router = useRouter();
  const t = useT();
  const pathname = usePathname();
  const currentConversationId = pathname?.match(/^\/chat\/([^/]+)/)?.[1];

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);

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
    if (!specialistId) return;
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
      {specialistId && specialistName ? (
        <SidebarHeader className="border-b border-[#e5e7eb] px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm">
                <AvatarImage src={specialistAvatarUrl} alt={specialistName} />
                <AvatarFallback className="text-xs bg-[#0367fb] text-white font-semibold">
                  {specialistName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#161616]">{specialistName}</p>
                <p className="truncate text-xs text-[#787878]">{specialistDomain}</p>
              </div>
            </div>
          </div>
        </SidebarHeader>
      ) : (
        <SidebarHeader className="border-b border-[#e5e7eb] px-4 py-4">
          <span className="font-heading text-sm font-bold text-[#0367fb]">ultra-ia</span>
        </SidebarHeader>
      )}

      {!specialistId && <SidebarContent />}

      {specialistId && (
        <>
          <div className="space-y-3 px-3 py-3">
            <Button
              onClick={handleNewConversation}
              disabled={isCreating}
              className="w-full justify-center gap-2 bg-[#0367fb] hover:bg-[#0256d4] text-white font-medium h-10 rounded-lg"
              size="sm"
              aria-label={t.sidebar.newConversation}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {isCreating ? t.sidebar.creating : t.sidebar.newConversation}
            </Button>

            {/* Search bar — Ctrl+K (AC5) */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#787878]"
                aria-hidden="true"
              />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder={t.sidebar.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-sm bg-[#f8f9fa] border-[#e5e7eb] rounded-lg placeholder:text-[#787878] focus:border-[#0367fb] focus:ring-[#0367fb]/20"
                aria-label={t.sidebar.searchAria}
              />
            </div>
          </div>

          <Separator className="bg-[#e5e7eb]" />

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
        </>
      )}

      {/* User account section */}
      {user && (
        <SidebarFooter className="border-t border-[#e5e7eb] px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[#f3f3f3] focus:outline-none bg-transparent border-0">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-[#e5e7eb]">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ''}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#0367fb] text-xs font-semibold text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="truncate text-sm font-medium text-[#161616]">
                  {user.name ?? t.admin.sidebar.myAccount}
                </span>
                {user.email && (
                  <span className="truncate text-xs text-[#787878]">
                    {user.email}
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#787878]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56 bg-white border-[#e5e7eb]">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-[#787878] font-normal px-3 py-2">
                  {user.email}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-[#e5e7eb]" />
              {pathname?.startsWith('/settings') ? (
                <DropdownMenuItem onClick={() => router.push('/chat')} className="text-[#161616] focus:bg-[#f3f3f3]">
                  <MessageSquare className="mr-2 h-4 w-4 text-[#787878]" />
                  {t.admin.sidebar.backToChat}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => router.push('/settings')} className="text-[#161616] focus:bg-[#f3f3f3]">
                  <Settings className="mr-2 h-4 w-4 text-[#787878]" />
                  {t.admin.sidebar.accountSettings}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => { setLocale(locale === 'fr' ? 'en' : 'fr'); router.refresh(); }}
                className="text-[#161616] focus:bg-[#f3f3f3]"
              >
                <Globe className="mr-2 h-4 w-4 text-[#787878]" />
                <span className="flex-1">{t.admin.sidebar.language}</span>
                <span className="text-xs text-[#0367fb] font-semibold">
                  {locale === 'fr' ? 'EN' : 'FR'}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e5e7eb]" />
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-50 focus:text-red-600"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.admin.sidebar.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
