import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-zinc-50/80 dark:bg-zinc-950 px-4">
      {/* Decorative gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #3B82F6 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #3B82F6 0%, transparent 70%)' }}
      />

      {/* Decorative SVG path */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-20 top-0 h-[70%] w-[400px] opacity-[0.04]"
          preserveAspectRatio="none"
          viewBox="0 0 780 1140"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="animate-[drawPath_3s_ease-out_0.5s_forwards]"
            d="M 555 0 C -514.95 653.314 502.942 726.558 720 509.5 C 937.058 292.442 174.231 575.033 381 1140"
            fill="transparent"
            stroke="currentColor"
            strokeDasharray="2420"
            strokeDashoffset="2420"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="relative font-heading text-2xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
      >
        ultra-ia
      </Link>

      {/* Content */}
      <div className="relative w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}
