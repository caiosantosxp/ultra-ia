import { getT } from '@/lib/i18n/get-t';

export default async function NotFound() {
  const t = await getT();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t.notFound.description}</p>
    </main>
  );
}
