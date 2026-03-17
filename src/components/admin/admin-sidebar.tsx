'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Globe, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { adminNavItems } from '@/lib/admin-nav';
import { useT } from '@/lib/i18n/use-t';
import { useLanguageStore } from '@/stores/language-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const t = useT();

  const navLabels: Record<string, string> = {
    '/admin/dashboard': t.admin.nav.dashboard,
    '/admin/agents': t.admin.nav.agents,
    '/admin/users': t.admin.nav.users,
    '/admin/analytics': t.admin.nav.analytics,
    '/admin/settings': t.admin.nav.settings,
  };

  return (
    <nav className="flex-1 space-y-1 p-3">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {navLabels[item.href] ?? item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const t = useT();
  return (
    <div className="border-t p-3">
      <Link
        href="/chat"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        {t.admin.sidebar.backToChat}
      </Link>
    </div>
  );
}

function SidebarUserSection({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const onSettingsPage = pathname?.startsWith('/settings');

  return (
    <div className="border-t px-2 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/60 focus:outline-none bg-transparent border-0">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-semibold text-muted-foreground">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate text-xs font-medium text-foreground">
              {user.name ?? t.admin.sidebar.myAccount}
            </span>
            {user.email && (
              <span className="truncate text-[10px] text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {user.email}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {onSettingsPage ? (
            <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t.admin.sidebar.backToDashboard}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              {t.admin.sidebar.accountSettings}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => { setLocale(locale === 'fr' ? 'en' : 'fr'); router.refresh(); }}
          >
            <Globe className="mr-2 h-4 w-4" />
            <span className="flex-1">{t.admin.sidebar.language}</span>
            <span className="text-xs text-muted-foreground font-medium">
              {locale === 'fr' ? 'EN' : 'FR'}
            </span>
          </DropdownMenuItem>
          {mounted && (
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark'
                ? <Sun className="mr-2 h-4 w-4" />
                : <Moon className="mr-2 h-4 w-4" />}
              {theme === 'dark' ? t.admin.sidebar.lightMode : t.admin.sidebar.darkMode}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t.admin.sidebar.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SidebarLogo() {
  return (
    <div className="flex h-14 items-center border-b px-4">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span className="font-heading text-sm font-bold text-primary">ultra-ia</span>
        <span className="text-xs text-muted-foreground">Admin</span>
      </Link>
    </div>
  );
}

// Desktop sidebar — sticky full height, hidden on mobile
export function AdminSidebar({ user }: { user?: SidebarUser }) {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-60 flex-col overflow-y-auto border-r bg-background">
      <SidebarLogo />
      <SidebarNav />
      <SidebarFooter />
      {user && <SidebarUserSection user={user} />}
    </aside>
  );
}

// Mobile sidebar trigger — shown only on mobile, auto-closes after nav click
export function AdminMobileSidebar({ user }: { user?: SidebarUser }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t.admin.sidebar.openMenu} />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-left text-sm font-bold text-primary">
            ultra-ia <span className="font-normal text-muted-foreground">Admin</span>
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavClick={() => setOpen(false)} />
        <SidebarFooter />
        {user && <SidebarUserSection user={user} />}
      </SheetContent>
    </Sheet>
  );
}
