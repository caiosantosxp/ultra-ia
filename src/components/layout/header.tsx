import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { UserMenu } from '@/components/shared/user-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import { DesktopNavLinks } from '@/components/layout/nav-links';
import { auth } from '@/lib/auth';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 lg:px-6">
        <Link href="/" className="font-heading text-xl font-bold text-primary">
          ultra-ia
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 lg:flex">
          <DesktopNavLinks />
          <ThemeToggle />
          {session?.user ? (
            <UserMenu user={session.user} />
          ) : (
            <Link href="/login" className={buttonVariants({ variant: 'secondary' })}>
              Se connecter
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
