import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe ultra-ia',
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold">Mot de passe oublié ?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
