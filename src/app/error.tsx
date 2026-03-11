'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Error</h1>
      <p className="mt-4 text-lg">{error.message}</p>
      <button className="mt-6" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
