import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  description: 'Créez un nouveau mot de passe pour votre compte ultra-ia',
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  if (!token) redirect('/forgot-password');

  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez un mot de passe sécurisé (minimum 8 caractères)
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
