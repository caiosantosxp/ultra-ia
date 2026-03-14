import type { Metadata } from 'next';
import { Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Configurações — Admin',
};

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Configurações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta seção está em desenvolvimento.
        </p>
      </div>
    </div>
  );
}
