import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { UserMenu } from '@/components/shared/user-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DesktopNavLinks } from '@/components/layout/nav-links';
import { auth } from '@/lib/auth';
import { getT } from '@/lib/i18n/get-t';

export async function Header() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 lg:px-6">
        <Link href="/" className="font-heading text-xl font-bold text-primary">
          ultra-ia
        </Link>

        {/* Desktop nav */}
        <nav aria-label={t.nav.mainNav} className="hidden items-center gap-3 lg:flex">
          <DesktopNavLinks />
          <LanguageSwitcher />
          <ThemeToggle />
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <Link href="/login" className={buttonVariants({ variant: 'secondary' })}>
              {t.nav.login}
            </Link>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="lg:hidden">
          <MobileNav isAuthenticated={!!session?.user} />
        </div>
      </div>
    </header>
  );
}
