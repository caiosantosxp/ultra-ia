'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2,
  BookOpen,
  ChevronRight,
  Globe,
  LayoutDashboard,
  LogOut,
  Mic,
  Moon,
  Settings,
  Settings2,
  Sun,
  TrendingUp,
  User,
  Users,
  Users2,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { fr, en } from '@/lib/i18n';
import { useLanguageStore } from '@/stores/language-store';
import type { Locale } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpertPanelSidebarProps {
  specialistId: string;
  specialistName: string;
  accentColor: string;
  /** Override base path. Defaults to /admin/agents/${specialistId} */
  basePath?: string;
  initialLocale?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ExpertPanelSidebar({
  specialistId,
  specialistName,
  accentColor,
  basePath,
  initialLocale = 'fr',
  user,
}: ExpertPanelSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale as Locale);
  const storeLocale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);

  // After Zustand hydrates from localStorage, sync to local state
  useEffect(() => {
    setLocaleState(storeLocale);
  }, [storeLocale]);

  const t = locale === 'en' ? en : fr;
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const base = basePath ?? `/admin/agents/${specialistId}`;

  function isActive(segment: string) {
    return pathname.startsWith(`${base}/${segment}`);
  }

  const onSettingsPage = pathname?.startsWith('/settings');

  function NavItem({
    href,
    icon: Icon,
    label,
    active,
    indent = false,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    active: boolean;
    indent?: boolean;
  }) {
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2.5 rounded-lg py-2 text-sm transition-colors',
          indent ? 'pl-7 pr-3' : 'px-3',
          active
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{label}</span>
      </Link>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {children}
      </p>
    );
  }

  const leadsActive = isActive('monetizacao/leads');
  const rendasActive = isActive('monetizacao/rendas');

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-background">
      {/* Expert identity */}
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {specialistName.charAt(0).toUpperCase()}
        </div>
        <span className="truncate text-sm font-medium">{specialistName}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavItem
          href={`${base}/dashboard`}
          icon={LayoutDashboard}
          label={t.admin.expertSidebar.dashboard}
          active={isActive('dashboard')}
        />
        <NavItem
          href={`${base}/analytics`}
          icon={BarChart2}
          label={t.admin.expertSidebar.usage}
          active={isActive('analytics')}
        />
        <NavItem
          href={`${base}/subscribers`}
          icon={Users2}
          label={t.admin.expertSidebar.subscribers}
          active={isActive('subscribers')}
        />
        <NavItem
          href={`${base}/personalizacao`}
          icon={Settings2}
          label={t.admin.expertSidebar.customization}
          active={isActive('personalizacao')}
        />

        <SectionLabel>{t.admin.expertSidebar.identitySection}</SectionLabel>
        <NavItem
          href={`${base}/identidade/treinamento`}
          icon={BookOpen}
          label={t.admin.expertSidebar.training}
          active={
            pathname.includes('/identidade/treinamento') ||
            pathname.endsWith('/identidade')
          }
        />
        <NavItem
          href={`${base}/identidade/voz`}
          icon={Mic}
          label={t.admin.expertSidebar.voice}
          active={pathname.includes('/identidade/voz')}
        />
        <NavItem
          href={`${base}/identidade/instrucoes`}
          icon={Settings}
          label={t.admin.expertSidebar.instructions}
          active={pathname.includes('/identidade/instrucoes')}
        />

        <SectionLabel>{t.admin.expertSidebar.monetizationSection}</SectionLabel>

        {/* Leads parent */}
        <div>
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm',
              leadsActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t.admin.expertSidebar.leads}</span>
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 shrink-0 opacity-50 transition-transform',
                leadsActive && 'rotate-90'
              )}
            />
          </div>
          {/* Sub-items always visible when in leads section, or always show */}
          <div className="mt-0.5 space-y-0.5">
            <NavItem
              href={`${base}/monetizacao/leads`}
              icon={Users}
              label={t.admin.expertSidebar.leadsTable}
              active={
                pathname === `${base}/monetizacao/leads` ||
                (leadsActive && !pathname.includes('/configuracao'))
              }
              indent
            />
            <NavItem
              href={`${base}/monetizacao/leads/configuracao`}
              icon={Settings2}
              label={t.admin.expertSidebar.leadsConfig}
              active={pathname.includes('/leads/configuracao')}
              indent
            />
          </div>
        </div>

        <NavItem
          href={`${base}/monetizacao/rendas`}
          icon={TrendingUp}
          label={t.admin.expertSidebar.revenue}
          active={rendasActive}
        />
      </nav>

      {/* Back link — only shown in admin view */}
      {!basePath && (
        <div className="border-t px-2 py-3">
          <Link
            href="/admin/agents"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.admin.expertSidebar.backToAgents}
          </Link>
        </div>
      )}

      {/* User account section */}
      {user && (
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
                    {user.name ?? t.admin.expertSidebar.myAccount}
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
                <DropdownMenuItem onClick={() => router.push(`${base}/dashboard`)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t.admin.expertSidebar.backToDashboard}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t.admin.expertSidebar.accountSettings}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => { const next = locale === 'fr' ? 'en' : 'fr'; setLocaleState(next); setLocale(next); router.refresh(); }}
              >
                <Globe className="mr-2 h-4 w-4" />
                <span className="flex-1">{t.admin.expertSidebar.language}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {locale === 'fr' ? 'EN' : 'FR'}
                </span>
              </DropdownMenuItem>
              {mounted && (
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark'
                    ? <Sun className="mr-2 h-4 w-4" />
                    : <Moon className="mr-2 h-4 w-4" />}
                  {theme === 'dark' ? t.admin.expertSidebar.lightMode : t.admin.expertSidebar.darkMode}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.admin.expertSidebar.signOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
