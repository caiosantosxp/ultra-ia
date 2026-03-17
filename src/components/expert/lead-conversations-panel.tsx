'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ChevronRight, MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeadConv {
  id: string;
  title: string | null;
  updatedAt: string;
  messageCount: number;
  lastMessage: { content: string; role: string } | null;
}

interface LeadItem {
  email: string;
  name: string | null;
  status: string;
  leadType: string;
  score: number;
  totalMessages: number;
  conversations: LeadConv[];
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  CONVERTED: 'Converti',
  LOST: 'Perdu',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-muted text-muted-foreground',
  CONTACTED: 'bg-blue-500/10 text-blue-500',
  CONVERTED: 'bg-green-500/10 text-green-600',
  LOST: 'bg-destructive/10 text-destructive',
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('err');
    return r.json();
  });

function initials(name: string | null, email: string) {
  if (name) return name[0].toUpperCase();
  return email[0].toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChatThread({ convId, onBack }: { convId: string; onBack: () => void }) {
  const { data, isLoading } = useSWR<{ conversation: { title: string | null; messages: Message[] } }>(
    `/api/expert/conversations/${convId}`,
    fetcher
  );

  const messages = data?.conversation.messages ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
          ← Voltar
        </button>
        <span className="text-xs text-muted-foreground">·</span>
        <p className="truncate text-sm font-medium">{data?.conversation.title ?? '…'}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading &&
          [1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
            </div>
          ))}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Sem mensagens</p>
        )}
        {messages.map((msg) => {
          const isUser = msg.role === 'USER';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeadConversationsPanel() {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const { data, isLoading } = useSWR<{ leads: LeadItem[] }>('/api/expert/conversations', fetcher, {
    refreshInterval: 300_000,
  });

  const leads = data?.leads ?? [];
  const selectedLead = leads.find((l) => l.email === selectedEmail) ?? null;

  function handleSelectLead(email: string) {
    setSelectedEmail(email);
    setSelectedConvId(null);
  }

  if (isLoading) {
    return (
      <div className="flex h-[520px] gap-px overflow-hidden rounded-lg border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 space-y-3 p-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MessageCircle className="h-8 w-8" />
          <p className="text-sm">Aucune conversation de leads pour le moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[520px] overflow-hidden rounded-lg border text-sm">
      {/* Panel 1 — Lead list */}
      <div className="w-56 shrink-0 overflow-y-auto border-r">
        <div className="sticky top-0 border-b bg-muted/40 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Leads ({leads.length})
          </p>
        </div>
        {leads.map((lead) => {
          const active = lead.email === selectedEmail;
          return (
            <button
              key={lead.email}
              onClick={() => handleSelectLead(lead.email)}
              className={`w-full border-b px-3 py-3 text-left transition-colors last:border-0 hover:bg-muted/40 ${active ? 'bg-muted/60' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(lead.name, lead.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-tight">{lead.name ?? lead.email}</p>
                  <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[lead.status] ?? ''}`}>
                    {STATUS_LABELS[lead.status] ?? lead.status}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-[10px] text-muted-foreground">{lead.conversations.length} conv.</span>
                  {active && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel 2 — Conversation list for selected lead */}
      <div className="w-64 shrink-0 overflow-y-auto border-r">
        {!selectedLead ? (
          <div className="flex h-full items-center justify-center">
            <p className="px-4 text-center text-xs text-muted-foreground">Sélectionnez un lead pour voir ses conversations</p>
          </div>
        ) : (
          <>
            <div className="sticky top-0 border-b bg-muted/40 px-3 py-2.5">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedLead.name ?? selectedLead.email}
              </p>
              <p className="text-[10px] text-muted-foreground">{selectedLead.conversations.length} conversation(s)</p>
            </div>
            {selectedLead.conversations.length === 0 && (
              <div className="flex h-32 items-center justify-center">
                <p className="text-xs text-muted-foreground">Aucune conversation</p>
              </div>
            )}
            {selectedLead.conversations.map((conv) => {
              const active = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full border-b px-3 py-3 text-left transition-colors last:border-0 hover:bg-muted/40 ${active ? 'bg-muted/60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 flex-1 text-xs font-medium leading-snug">{conv.title ?? 'Conversation'}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(conv.updatedAt)}</span>
                  </div>
                  {conv.lastMessage && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {conv.lastMessage.role === 'USER' ? '👤' : '🤖'} {conv.lastMessage.content}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {conv.messageCount} msgs
                    </Badge>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Panel 3 — Message thread */}
      <div className="flex-1 overflow-hidden">
        {!selectedConvId ? (
          <div className="flex h-full items-center justify-center">
            <p className="px-4 text-center text-xs text-muted-foreground">Sélectionnez une conversation pour lire les messages</p>
          </div>
        ) : (
          <ChatThread convId={selectedConvId} onBack={() => setSelectedConvId(null)} />
        )}
      </div>
    </div>
  );
}
