'use client';

import { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Globe, LayoutDashboard, LogOut, Menu, Settings, User } from 'lucide-react';
import { signOut } from 'next-auth/react';

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
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-[#0367fb]/10 font-medium text-[#0367fb]'
                : 'text-[#787878] hover:bg-[#f3f3f3] hover:text-[#161616]'
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


function SidebarUserSection({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const onSettingsPage = pathname?.startsWith('/settings');

  return (
    <div className="border-t border-[#e5e7eb] px-2 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[#f3f3f3] focus:outline-none bg-transparent border-0">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ''}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f3f3f3] text-xs font-semibold text-[#787878]">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col text-left">
            <span className="truncate text-xs font-medium text-[#161616]">
              {user.name ?? t.admin.sidebar.myAccount}
            </span>
            {user.email && (
              <span className="truncate text-[10px] text-[#787878]">
                {user.email}
              </span>
            )}
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#787878]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-[#787878] font-normal">
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
            <span className="text-xs text-[#787878] font-medium">
              {locale === 'fr' ? 'EN' : 'FR'}
            </span>
          </DropdownMenuItem>
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

// Desktop sidebar content — rendered inside aside in layout
export function AdminSidebar({ user }: { user?: SidebarUser }) {
  return (
    <>
      <SidebarNav />
      {user && <SidebarUserSection user={user} />}
    </>
  );
}

// Mobile sidebar trigger
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
        <Menu className="h-5 w-5 text-[#161616]" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0 bg-white">
        <SheetHeader className="border-b border-[#e5e7eb] px-4 py-3">
          <SheetTitle className="text-left text-sm font-bold text-[#0367fb]">
            ultra-ia <span className="font-normal text-[#787878]">Admin</span>
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavClick={() => setOpen(false)} />

        {user && <SidebarUserSection user={user} />}
      </SheetContent>
    </Sheet>
  );
}
