'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart2, Settings2, Fingerprint, DollarSign } from 'lucide-react';

import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: 'analytics', icon: BarChart2 },
  { label: 'Personalização', path: 'personalizacao', icon: Settings2 },
  { label: 'Identidade', path: 'identidade', icon: Fingerprint },
  { label: 'Monetização', path: 'monetizacao', icon: DollarSign },
];

export function ExpertPanelNav({ specialistId }: { specialistId: string }) {
  const pathname = usePathname();
  const base = `/admin/agents/${specialistId}`;

  return (
    <nav className="flex overflow-x-auto border-b" aria-label="Navegação do painel do expert">
      {NAV_ITEMS.map((item) => {
        const href = `${base}/${item.path}`;
        const isActive = pathname.startsWith(href);
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={href}
            className={cn(
              'flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
