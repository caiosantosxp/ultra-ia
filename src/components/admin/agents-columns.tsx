'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, LayoutDashboard, MessageSquare, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { toggleSpecialistActive, deleteSpecialist } from '@/actions/admin-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditAgentDialog } from '@/components/admin/edit-agent-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useT } from '@/lib/i18n/use-t';
import type { Translation } from '@/lib/i18n';

export type AgentRow = {
  id: string;
  name: string;
  domain: string;
  slug: string;
  price: number;
  isActive: boolean;
  accentColor: string;
  avatarUrl: string;
  createdAt: Date;
  description: string;
  language: string;
  tags: string[];
  quickPrompts: string[];
  systemPrompt: string | null;
  scopeLimits: string | null;
  webhookUrl: string | null;
  owner?: { id: string; name: string | null; email: string | null } | null;
  _count: { subscriptions: number; conversations: number };
};

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useT();

  async function handleToggle() {
    setLoading(true);
    const result = await toggleSpecialistActive(id);
    if (result.success && result.data) {
      setActive(result.data.isActive);
      router.refresh();
    } else {
      toast.error(t.admin.agentsPage.toggleStatusError);
    }
    setLoading(false);
  }

  return (
    <Switch
      checked={active}
      onCheckedChange={handleToggle}
      disabled={loading}
      aria-label={active ? t.admin.agentsPage.deactivate : t.admin.agentsPage.activate}
    />
  );
}

function ActionsCell({ row }: { row: { original: AgentRow } }) {
  const router = useRouter();
  const t = useT();
  const agent = row.original;
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!confirm(t.admin.agentsPage.deleteConfirm)) return;
    const result = await deleteSpecialist(agent.id);
    if (result.success) {
      toast.success(t.admin.agentsPage.deleteSuccess);
      router.refresh();
    } else {
      toast.error(result.error?.message ?? t.admin.agentsPage.deleteError);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions" />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)} className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            {t.admin.agentsPage.editAction}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={`/admin/agents/${agent.id}`} className="flex items-center gap-2 w-full">
              <LayoutDashboard className="h-4 w-4" />
              {t.admin.agentsPage.expertPanelAction}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t.admin.agentsPage.deleteAction}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditAgentDialog agent={agent} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

export function getAgentColumns(t: Translation): ColumnDef<AgentRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 gap-1"
        >
          {t.admin.agentsPage.colName}
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <Link
            href={`/admin/agents/${agent.id}`}
            className="flex items-center gap-3 group"
          >
            <span
              className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: agent.accentColor || '#6366f1' }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-medium group-hover:underline leading-none">{agent.name}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                {agent.domain}
                <span className="ml-1.5 font-mono opacity-60">{agent.slug}</span>
              </p>
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 gap-1"
        >
          {t.admin.agentsPage.colPrice}
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const price = row.getValue<number>('price');
        return <span className="font-medium tabular-nums">{(price / 100).toFixed(2)} €</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: t.admin.agentsPage.colStatus,
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>('isActive');
        return (
          <div className="flex items-center gap-2">
            <ActiveToggle id={row.original.id} isActive={isActive} />
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
              {isActive ? t.admin.agentsPage.statusActive : t.admin.agentsPage.statusInactive}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'owner',
      header: t.admin.agentsPage.colOwner,
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner)
          return (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              {t.admin.agentsPage.noOwner}
            </Badge>
          );
        return (
          <Link href={`/admin/users/${owner.id}`} className="text-xs hover:underline text-foreground">
            {owner.name ?? owner.email ?? owner.id}
          </Link>
        );
      },
    },
    {
      accessorKey: '_count',
      header: t.admin.agentsPage.colSubscribers,
      cell: ({ row }) => {
        const { subscriptions, conversations } = row.original._count;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-sm font-medium">
              <Users className="h-3 w-3 text-muted-foreground" />
              {subscriptions}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {conversations}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3 gap-1"
        >
          {t.admin.agentsPage.colCreatedAt}
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue<Date>('createdAt'));
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString(t.dateLocale)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionsCell row={row} />,
    },
  ];
}

// Keep backward-compatible named export (unused, but prevents import errors during migration)
export const agentColumns = [] as ColumnDef<AgentRow>[];
