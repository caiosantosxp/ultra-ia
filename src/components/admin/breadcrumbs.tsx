'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useT } from '@/lib/i18n/use-t';

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useT();

  const SEGMENT_LABELS: Record<string, string> = {
    admin: 'Admin',
    dashboard: t.admin.nav.dashboard,
    agents: t.admin.nav.agents,
    users: t.admin.nav.users,
    analytics: t.admin.nav.analytics,
    settings: t.admin.nav.settings,
    identidade: t.admin.expertSidebar.identitySection,
    treinamento: t.admin.expertSidebar.training,
    instrucoes: t.admin.expertSidebar.instructions,
    personalizacao: t.admin.expertSidebar.customization,
    monetizacao: t.admin.expertSidebar.monetizationSection,
    leads: t.admin.expertSidebar.leads,
    configuracao: t.admin.expertSidebar.leadsConfig,
    rendas: t.admin.expertSidebar.revenue,
    subscribers: t.admin.expertSidebar.subscribers,
  };

  // Detects CUID / UUID / any opaque ID segment (long random-looking string)
  const ID_PATTERN = /^[a-z0-9]{20,}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function formatSegment(segment: string): string {
    return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  const rawSegments = pathname.split('/').filter(Boolean);
  if (rawSegments.length === 0) return null;

  // Build cumulative hrefs, skip opaque ID segments from display
  const crumbs: Array<{ href: string; label: string; isLast: boolean }> = [];
  rawSegments.forEach((segment, index) => {
    const href = '/' + rawSegments.slice(0, index + 1).join('/');
    if (ID_PATTERN.test(segment)) return; // hide raw IDs
    crumbs.push({ href, label: formatSegment(segment), isLast: false });
  });

  crumbs.forEach((c, i) => { c.isLast = i === crumbs.length - 1; });

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-[#787878]">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            {crumb.isLast ? (
              <span className="font-medium text-[#161616]" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-[#161616] transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
