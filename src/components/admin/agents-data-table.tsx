'use client';

import { useState, useMemo } from 'react';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { BotMessageSquare, TrendingUp, Users, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type AgentRow, getAgentColumns } from '@/components/admin/agents-columns';
import { useT } from '@/lib/i18n/use-t';

interface AgentsDataTableProps {
  data: AgentRow[];
}

type StatusFilter = 'all' | 'active' | 'inactive';

export function AgentsDataTable({ data }: AgentsDataTableProps) {
  const t = useT();
  const columns = useMemo(() => getAgentColumns(t), [t]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((a) => a.isActive).length,
    inactive: data.filter((a) => !a.isActive).length,
    subscribers: data.reduce((sum, a) => sum + a._count.subscriptions, 0),
  }), [data]);

  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return data;
    return data.filter((a) => (statusFilter === 'active' ? a.isActive : !a.isActive));
  }, [data, statusFilter]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table known limitation with React Compiler
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    globalFilterFn: (row, _columnId, value: string) => {
      const name = row.original.name.toLowerCase();
      const domain = row.original.domain.toLowerCase();
      return name.includes(value.toLowerCase()) || domain.includes(value.toLowerCase());
    },
  });

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: t.admin.agentsPage.filterAll, count: stats.total },
    { key: 'active', label: t.admin.agentsPage.filterActive, count: stats.active },
    { key: 'inactive', label: t.admin.agentsPage.filterInactive, count: stats.inactive },
  ];

  return (
    <div className="space-y-5">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<BotMessageSquare className="h-4 w-4" />}
          label={t.admin.agentsPage.statsAgents}
          value={stats.total}
          color="bg-violet-500/10 text-violet-500"
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label={t.admin.agentsPage.statsActive}
          value={stats.active}
          color="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t.admin.agentsPage.statsInactive}
          value={stats.inactive}
          color="bg-muted text-muted-foreground"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label={t.admin.agentsPage.statsSubscribers}
          value={stats.subscribers}
          color="bg-blue-500/10 text-blue-500"
        />
      </div>

      {/* Search + filter tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Input
          placeholder={t.admin.agentsPage.searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span
                className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                  statusFilter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted-foreground/20'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {t.admin.agentsPage.noAgents}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {t.admin.agentsPage.total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t.admin.agentsPage.previous}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t.admin.agentsPage.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
      <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

export function AgentsDataTableSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
