import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminSidebar, AdminMobileSidebar } from '@/components/admin/admin-sidebar';
import { Breadcrumbs } from '@/components/admin/breadcrumbs';

export const metadata: Metadata = {
  title: 'Dashboard | Admin Ultra-IA',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar (240px, fixed) */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Mobile header with hamburger */}
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <AdminMobileSidebar />
          <span className="font-heading text-sm font-bold text-primary">Painel Admin</span>
        </header>

        <main className="flex-1 p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
