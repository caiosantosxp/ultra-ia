'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { cn } from '@/lib/utils';
import { adminNavItems } from '@/lib/admin-nav';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t p-3">
      <Link
        href="/chat"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        ← Voltar para o chat
      </Link>
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
export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-60 flex-col overflow-y-auto border-r bg-background">
      <SidebarLogo />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}

// Mobile sidebar trigger — shown only on mobile, auto-closes after nav click
export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" />
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
      </SheetContent>
    </Sheet>
  );
}
