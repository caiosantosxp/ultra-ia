import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button-variants';

export function PaymentBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-sm font-medium">
          Votre paiement a échoué. Mettez à jour votre moyen de paiement pour continuer à utiliser
          le service.
        </p>
      </div>
      <Link
        href="/billing"
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        Mettre à jour
      </Link>
    </div>
  );
}
