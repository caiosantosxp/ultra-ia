import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.forgotPassword.metaTitle,
    description: t.forgotPassword.metaDesc,
  };
}

export default async function ForgotPasswordPage() {
  const t = await getT();

  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.forgotPassword.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.forgotPassword.description}</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
