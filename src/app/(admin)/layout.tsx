import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminSidebar, AdminMobileSidebar } from '@/components/admin/admin-sidebar';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.admin.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/chat');
  }

  const t = await getT();

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]" data-theme="light">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-60 flex-col overflow-y-auto border-r border-[#e5e7eb] bg-white">
        <div className="flex h-14 items-center border-b border-[#e5e7eb] px-4">
          <span className="text-sm font-bold text-[#0367fb]">ultra-ia</span>
          <span className="ml-2 text-xs text-[#787878]">Admin</span>
        </div>
        <AdminSidebar user={user} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 lg:hidden">
          <AdminMobileSidebar user={user} />
          <span className="text-sm font-bold text-[#0367fb]">{t.admin.sidebar.adminTitle}</span>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
