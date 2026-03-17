import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.adminSettings.metaTitle };
}

export default async function AdminSettingsPage() {
  const t = await getT();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{t.adminSettings.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.adminSettings.description}</p>
      </div>
    </div>
  );
}
