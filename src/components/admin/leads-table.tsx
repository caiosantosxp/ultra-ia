'use client';

import { useState, useTransition } from 'react';
import { CheckSquare, ChevronLeft, ChevronRight, Phone, Search, Square } from 'lucide-react';

import { updateLeadStatus } from '@/actions/expert-panel-actions';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';
type LeadType = 'LEAD' | 'PREMIUM';

interface Lead {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  score: number;
  source: string | null;
  status: LeadStatus;
  leadType: LeadType;
  createdAt: Date;
}

interface LeadsTableProps {
  leads: Lead[];
  specialistId: string;
}

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'text-blue-600 bg-blue-50 border-blue-200',
  CONTACTED: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  CONVERTED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  LOST: 'text-red-600 bg-red-50 border-red-200',
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-red-500 text-white'
      : score >= 50
        ? 'bg-orange-400 text-white'
        : 'bg-slate-200 text-slate-700';
  return (
    <span className={cn('inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold min-w-[2.5rem]', color)}>
      {score}
    </span>
  );
}

function AvatarInitials({ name, email }: { name: string | null; email: string }) {
  const display = name ?? email;
  const initials = display
    .split(/[\s.@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  const colors = [
    'bg-blue-400',
    'bg-purple-400',
    'bg-pink-400',
    'bg-teal-400',
    'bg-orange-400',
    'bg-indigo-400',
  ];
  const idx = display.charCodeAt(0) % colors.length;
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white',
        colors[idx]
      )}
    >
      {initials || '?'}
    </div>
  );
}

type TabKey = 'all' | LeadStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'NEW', label: 'Novo' },
  { key: 'CONTACTED', label: 'Ativo' },
  { key: 'CONVERTED', label: 'Convertido' },
  { key: 'LOST', label: 'Inativo' },
];

export function LeadsTable({ leads, specialistId }: LeadsTableProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const filtered = leads.filter((l) => {
    const matchesSearch =
      !search ||
      (l.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'all' || l.status === tab;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function countByStatus(status: LeadStatus) {
    return leads.filter((l) => l.status === status).length;
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((l) => l.id)));
    }
  }

  function handleStatusChange(leadId: string, status: LeadStatus) {
    startTransition(() => {
      updateLeadStatus(leadId, status);
    });
  }

  function formatDate(date: Date) {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 86400000);
    if (diff === 0) return 'aujourd\'hui';
    if (diff === 1) return 'il y a 1 jour';
    if (diff < 7) return `il y a ${diff} jours`;
    if (diff < 30) return `il y a ${Math.floor(diff / 7)} sem.`;
    if (diff < 365) return `il y a ${Math.floor(diff / 30)} mois`;
    return `il y a ${Math.floor(diff / 365)} ans`;
  }

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1); }}
            className={cn(
              'flex shrink-0 items-center gap-1.5 pb-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
              {key === 'all' ? leads.length : countByStatus(key as LeadStatus)}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          {selected.size === paginated.length && paginated.length > 0 ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          Selecionar todos
        </button>

        {/* Pagination */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded p-1 hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors',
                page === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {p}
            </button>
          ))}
          {totalPages > 5 && <span>…{totalPages}</span>}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded p-1 hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto] items-center gap-3 border-b bg-muted/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="w-4" />
          <span>Nome</span>
          <span className="w-20">Telefone</span>
          <span className="w-16">Source</span>
          <span className="w-16">Tipo</span>
          <span className="w-14">Score</span>
          <span className="w-28">Status</span>
          <span className="w-28">Últ. mensagem</span>
          <span className="w-6" />
        </div>

        {paginated.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {paginated.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Checkbox */}
                <button onClick={() => toggleSelect(lead.id)}>
                  {selected.has(lead.id) ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Name + email */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <AvatarInitials name={lead.name} email={lead.email} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">
                      {lead.name ?? lead.email.split('@')[0]}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{lead.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="w-20">
                  {lead.phone ? (
                    <span className="text-xs text-muted-foreground">{lead.phone}</span>
                  ) : (
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/30" />
                  )}
                </div>

                {/* Source */}
                <div className="w-16">
                  {lead.source ? (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-200 text-blue-600 bg-blue-50">
                      {lead.source}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </div>

                {/* Type */}
                <div className="w-16">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] py-0 px-1.5',
                      lead.leadType === 'PREMIUM'
                        ? 'border-amber-200 text-amber-700 bg-amber-50'
                        : 'border-slate-200 text-slate-600'
                    )}
                  >
                    {lead.leadType === 'PREMIUM' ? 'Premium ★' : 'Lead'}
                  </Badge>
                </div>

                {/* Score */}
                <div className="w-14">
                  <ScoreBadge score={lead.score} />
                </div>

                {/* Status dropdown */}
                <div className="w-28">
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                    className={cn(
                      'w-full rounded-md border px-2 py-1 text-xs font-medium appearance-none cursor-pointer transition-colors',
                      STATUS_COLORS[lead.status]
                    )}
                  >
                    {(Object.entries(STATUS_LABELS) as [LeadStatus, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Last message (createdAt as proxy) */}
                <div className="w-28">
                  <span className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
                </div>

                {/* Extra */}
                <div className="w-6">
                  <span className="text-xs text-muted-foreground/40">—</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
