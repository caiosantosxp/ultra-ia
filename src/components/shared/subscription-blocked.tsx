import type { SubscriptionStatus } from '@prisma/client';
import { ShieldOff } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button-variants';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Status = SubscriptionStatus | 'none';

const MESSAGES: Record<Status, { title: string; description: string }> = {
  CANCELED: {
    title: 'Abonnement annulé',
    description:
      'Votre abonnement a été annulé. Réabonnez-vous pour accéder au chat.',
  },
  EXPIRED: {
    title: 'Abonnement expiré',
    description: 'Votre abonnement a expiré. Renouvelez pour continuer.',
  },
  PENDING: {
    title: 'Paiement en attente',
    description:
      'Votre abonnement est en attente de confirmation. Finalisez votre paiement pour accéder au chat.',
  },
  PAST_DUE: {
    title: 'Paiement en retard',
    description:
      'Votre paiement est en retard. Mettez à jour votre moyen de paiement pour continuer.',
  },
  ACTIVE: {
    title: 'Accès temporairement indisponible',
    description: 'Une erreur inattendue est survenue. Veuillez actualiser la page ou contacter le support.',
  },
  none: {
    title: 'Aucun abonnement',
    description:
      "Vous n'avez pas encore d'abonnement. Choisissez un spécialiste pour commencer.",
  },
};

interface SubscriptionBlockedPageProps {
  status: Status;
}

export function SubscriptionBlockedPage({ status }: SubscriptionBlockedPageProps) {
  const { title, description } = MESSAGES[status] ?? MESSAGES.none;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <ShieldOff
            className="mb-2 h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>{description}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/pricing" className={buttonVariants({ variant: 'default' })}>
            Voir les offres
          </Link>
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            Retour à l&apos;accueil
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
