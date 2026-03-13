'use client';

import useSWRInfinite from 'swr/infinite';

interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  createdAt: string;
  specialistId: string;
  // HIGH-2 fix: snippet of last message for client-side content search (AC5)
  lastMessageSnippet: string | null;
  specialist: {
    id: string;
    name: string;
    avatarUrl: string;
    accentColor: string;
  };
}

interface ConversationsPage {
  success: boolean;
  data: ConversationSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<ConversationsPage>;
  });

export function useConversations() {
  const getKey = (pageIndex: number, previousPageData: ConversationsPage | null) => {
    if (previousPageData && !previousPageData.pagination?.hasMore) return null;
    return `/api/conversations?page=${pageIndex + 1}&limit=20`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<ConversationsPage>(
    getKey,
    fetcher,
    { revalidateOnFocus: false },
  );

  const conversations: ConversationSummary[] = data
    ? data.flatMap((page) => page.data ?? [])
    : [];
  const hasMore = data ? (data[data.length - 1]?.pagination?.hasMore ?? false) : false;

  return {
    conversations,
    hasMore,
    isLoading,
    error,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

export type { ConversationSummary };
