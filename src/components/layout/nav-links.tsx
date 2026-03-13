'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';

export const navHrefs = [
  { href: '/#specialists', key: 'specialists' as const },
  { href: '/pricing', key: 'pricing' as const },
];

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
            'text-sm font-medium transition-colors hover:text-foreground',
            pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {t.nav[link.key]}
        </Link>
      ))}
    </>
  );
}
