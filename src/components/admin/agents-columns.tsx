'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { toggleSpecialistActive, deleteSpecialist } from '@/actions/admin-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  createdAt: Date;
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions" />
        }
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Link href={`/admin/agents/${agent.id}`} className="flex items-center gap-2 w-full">
            <Pencil className="h-4 w-4" />
            {t.admin.agentsPage.editAction}
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
      cell: ({ row }) => (
        <Link
          href={`/admin/agents/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'domain',
      header: t.admin.agentsPage.colDomain,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue('slug')}</span>
      ),
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
        return <span>{(price / 100).toFixed(2)} €</span>;
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
            <Badge variant={isActive ? 'default' : 'secondary'}>
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
        if (!owner) return <Badge variant="outline" className="text-muted-foreground text-xs">{t.admin.agentsPage.noOwner}</Badge>;
        return (
          <Link
            href={`/admin/users/${owner.id}`}
            className="text-xs hover:underline text-foreground"
          >
            {owner.name ?? owner.email ?? owner.id}
          </Link>
        );
      },
    },
    {
      accessorKey: '_count',
      header: t.admin.agentsPage.colSubscribers,
      cell: ({ row }) => row.original._count.subscriptions,
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
