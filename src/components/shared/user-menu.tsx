'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/actions/auth-actions';

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Menu de l'utilisateur"
          >
            {initials}
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/settings" className="w-full">
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => startTransition(async () => { await logout(); })}
        >
          {isPending ? 'Déconnexion...' : 'Déconnexion'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
