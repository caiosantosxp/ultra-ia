import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';

export const metadata: Metadata = {
  title: 'Erreur de connexion',
};

const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked:
    'Ce compte est déjà associé à une autre méthode de connexion. Connectez-vous avec la méthode utilisée initialement.',
  CredentialsSignin: 'Email ou mot de passe incorrect.',
  OAuthSignin: 'Erreur lors de la connexion avec le fournisseur externe.',
  OAuthCallback: 'Erreur lors du retour du fournisseur externe.',
  SessionRequired: 'Veuillez vous connecter pour accéder à cette page.',
};

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { error } = await searchParams;
  const message =
    (error && errorMessages[error]) ??
    'Une erreur est survenue lors de la connexion. Veuillez réessayer.';

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-card p-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-bold">Erreur de connexion</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Link href="/login" className={buttonVariants()}>
        Retour à la connexion
      </Link>
    </div>
  );
}
