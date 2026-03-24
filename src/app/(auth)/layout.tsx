import Link from 'next/link';

/**
 * Auth Layout - NexAgent Design System
 * Dark blue background (#041c40) with gradient orbs
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-[#041c40] px-4">
      {/* Decorative gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(ellipse, #0367fb 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(ellipse, #33e9bf 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-80"
      >
        ultra-ia
      </Link>

      {/* Content */}
      <div className="relative w-full max-w-[420px]">
        {children}
      </div>
    </main>
  );
}
