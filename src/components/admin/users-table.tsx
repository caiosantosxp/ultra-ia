'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { SubscriptionStatus } from '@/generated/prisma';
import useSWR from 'swr';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT } from '@/lib/i18n/use-t';

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: string;
  deletedAt: string | null;
  subscriptions: Array<{
    status: SubscriptionStatus;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface UsersResponse {
  success: boolean;
  data: UserRow[];
  pagination: Pagination;
}

type RoleFilter = '' | 'USER' | 'EXPERT' | 'ADMIN';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getUserInitials(name: string | null, email: string | null): string {
  if (name) {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

function SubscriptionBadge({ status }: { status: SubscriptionStatus | undefined }) {
  const t = useT();

  if (!status) {
    return <Badge variant="secondary">{t.admin.usersPage.noSubscription}</Badge>;
  }

  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
          {t.admin.usersPage.statusActive}
        </Badge>
      );
    case 'PAST_DUE':
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
          {t.admin.usersPage.statusPastDue}
        </Badge>
      );
    case 'CANCELED':
      return <Badge variant="secondary">{t.admin.usersPage.statusCanceled}</Badge>;
    case 'EXPIRED':
      return <Badge variant="secondary">{t.admin.usersPage.statusExpired}</Badge>;
    case 'PENDING':
      return <Badge variant="outline">{t.admin.usersPage.statusPending}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'ADMIN':
      return <Badge variant="default">ADMIN</Badge>;
    case 'EXPERT':
      return <Badge variant="secondary">EXPERT</Badge>;
    default:
      return <Badge variant="outline">USER</Badge>;
  }
}

export function UsersTable() {
  const t = useT();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({
    search: debouncedSearch,
    page: String(page),
    limit: '20',
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(includeDeleted ? { includeDeleted: 'true' } : {}),
  });

  const { data, isLoading, error } = useSWR<UsersResponse>(
    `/api/admin/users?${params}`,
    fetcher,
    { keepPreviousData: true }
  );

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.admin.usersPage.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(val) => { setRoleFilter(val as RoleFilter); setPage(1); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t.admin.usersPage.allRoles} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t.admin.usersPage.allRoles}</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="EXPERT">EXPERT</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>

        <Label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer font-normal">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
          />
          {t.admin.usersPage.showInactive}
        </Label>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.usersPage.colName}</TableHead>
              <TableHead>{t.admin.usersPage.colEmail}</TableHead>
              <TableHead>{t.admin.usersPage.colRole}</TableHead>
              <TableHead>{t.admin.usersPage.colCreatedAt}</TableHead>
              <TableHead>{t.admin.usersPage.colSubscription}</TableHead>
              <TableHead className="w-24">{t.admin.usersPage.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-destructive">
                  {t.admin.usersPage.loadError}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t.admin.usersPage.noUsers}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const latestSub = user.subscriptions[0];
                const isInactive = !!user.deletedAt;
                return (
                  <TableRow key={user.id} className={isInactive ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          {user.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                          <AvatarFallback>{getUserInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          {user.name ?? '—'}
                          {isInactive && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              {t.admin.usersPage.inactiveBadge}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email ?? '—'}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString(t.dateLocale)}
                    </TableCell>
                    <TableCell>
                      <SubscriptionBadge status={latestSub?.status} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm' })}
                      >
                        {t.admin.usersPage.details}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {pagination.total} {t.admin.usersPage.totalUsers}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t.admin.usersPage.previous}
            </Button>
            <span>
              {t.admin.usersPage.page} {page} {t.admin.usersPage.of} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              {t.admin.usersPage.next}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
