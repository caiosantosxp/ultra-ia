import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { UserMenu } from '@/components/shared/user-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DesktopNavLinks } from '@/components/layout/nav-links';
import { auth } from '@/lib/auth';
import { getT } from '@/lib/i18n/get-t';
import { cn } from '@/lib/utils';

/**
 * NexAgent Design System — Header
 * Clean light navigation bar
 */
export async function Header() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#0367fb] transition-opacity hover:opacity-80"
        >
          ultra-ia
        </Link>

        {/* Desktop nav */}
        <nav aria-label={t.nav.mainNav} className="hidden items-center gap-1 lg:flex">
          <DesktopNavLinks />
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'sm' }),
                  'bg-[#0367fb] hover:bg-[#0550c8] text-white'
                )}
              >
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden">
          <MobileNav isAuthenticated={!!session?.user} />
        </div>
      </div>
    </header>
  );
}
