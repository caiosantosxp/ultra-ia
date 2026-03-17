'use client';

import { useT } from '@/lib/i18n/use-t';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">{t.errorPage.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{error.message}</p>
      <button
        className="mt-6 rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={reset}
      >
        {t.errorPage.retry}
      </button>
    </main>
  );
}
