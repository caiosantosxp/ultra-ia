'use client';

import { useState } from 'react';

import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function PaymentBanner() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleOpenPortal() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast.error("Impossible d'ouvrir le portail de paiement.");
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/50 dark:bg-amber-900/20 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-amber-800 dark:text-amber-200">
          Votre paiement a échoué. Mettez à jour vos informations de paiement pour maintenir
          l&apos;accès à votre spécialiste.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpenPortal}
        disabled={isLoading}
        className="shrink-0 border-amber-300 bg-white text-amber-800 hover:bg-amber-50 dark:border-amber-700 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-900/30"
        aria-label="Mettre à jour les informations de paiement"
      >
        {isLoading ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : null}
        Mettre à jour le paiement
      </Button>
    </div>
  );
}
