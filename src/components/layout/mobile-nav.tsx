'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { logout } from '@/actions/auth-actions';
import { cn } from '@/lib/utils';
import { navLinks } from '@/components/layout/nav-links';

interface MobileNavProps {
  isAuthenticated?: boolean;
}

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Ouvrir le menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        }
      />
      <SheetContent side="right" className="w-[280px]">
        <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
        <nav aria-label="Navigation mobile" className="mt-8 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'text-lg font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-2 border-t" />
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}
              >
                Mon profil
              </Link>
              <button
                disabled={isLoggingOut}
                onClick={() => {
                  setOpen(false);
                  startLogoutTransition(async () => { await logout(); });
                }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'mt-1 text-destructive hover:text-destructive')}
              >
                {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), 'mt-2')}
            >
              Se connecter
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
