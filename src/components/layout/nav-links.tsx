'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';

export const navHrefs = [
  { href: '/#specialists', key: 'specialists' as const },
  { href: '/pricing', key: 'pricing' as const },
];

/**
 * NexAgent Design System — Desktop Nav Links
 */
export function DesktopNavLinks() {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      {navHrefs.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'relative px-4 py-2 text-sm font-medium transition-colors',
            pathname === link.href
              ? 'text-white'
              : 'text-white/60 hover:text-white'
          )}
        >
          {t.nav[link.key]}
          {pathname === link.href && (
            <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#0367fb]" />
          )}
        </Link>
      ))}
    </>
  );
}
