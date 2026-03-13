'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { logout } from '@/actions/auth-actions';
import { cn } from '@/lib/utils';
import { navHrefs } from '@/components/layout/nav-links';
import { useT } from '@/lib/i18n/use-t';

interface MobileNavProps {
  isAuthenticated?: boolean;
}

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const pathname = usePathname();
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t.nav.mobileMenu}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        }
      />
      <SheetContent side="right" className="w-[280px]">
        <SheetTitle className="sr-only">{t.nav.mobileTitle}</SheetTitle>
        <nav aria-label={t.nav.mobileNav} className="mt-8 flex flex-col gap-4">
          {navHrefs.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'text-lg font-medium transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-foreground'
              )}
            >
              {t.nav[link.key]}
            </Link>
          ))}
          <div className="my-2 border-t" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {isAuthenticated ? (
            <>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}
              >
                {t.userMenu.profile}
              </Link>
              <button
                disabled={isLoggingOut}
                onClick={() => {
                  setOpen(false);
                  startLogoutTransition(async () => { await logout(); });
                }}
                className={cn(buttonVariants({ variant: 'ghost' }), 'mt-1 text-destructive hover:text-destructive')}
              >
                {isLoggingOut ? t.userMenu.loggingOut : t.userMenu.logout}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), 'mt-2')}
            >
              {t.nav.login}
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
