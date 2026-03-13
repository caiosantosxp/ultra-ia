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

export type AgentRow = {
  id: string;
  name: string;
  domain: string;
  slug: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  _count: { subscriptions: number; conversations: number };
};

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    const result = await toggleSpecialistActive(id);
    if (result.success && result.data) {
      setActive(result.data.isActive);
      router.refresh();
    } else {
      toast.error('Échec de la mise à jour du statut');
    }
    setLoading(false);
  }

  return (
    <Switch
      checked={active}
      onCheckedChange={handleToggle}
      disabled={loading}
      aria-label={active ? 'Désactiver' : 'Activer'}
    />
  );
}

function ActionsCell({ row }: { row: { original: AgentRow } }) {
  const router = useRouter();
  const agent = row.original;

  async function handleDelete() {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cet agent ?`)) return;
    const result = await deleteSpecialist(agent.id);
    if (result.success) {
      toast.success('Agent supprimé');
      router.refresh();
    } else {
      toast.error(result.error?.message ?? 'Échec de la suppression');
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
            Éditer
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleDelete}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const agentColumns: ColumnDef<AgentRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-3 gap-1"
      >
        Nom
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
    header: 'Domaine',
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
        Prix
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
    header: 'Statut',
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>('isActive');
      return (
        <div className="flex items-center gap-2">
          <ActiveToggle id={row.original.id} isActive={isActive} />
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: '_count',
    header: 'Abonnés',
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
        Créé le
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<Date>('createdAt'));
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString('fr-FR')}
        </span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
