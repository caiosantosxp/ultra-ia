import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.resetPassword.metaTitle,
    description: t.resetPassword.metaDesc,
  };
}

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const t = await getT();
  const { token } = await searchParams;
  if (!token) redirect('/forgot-password');

  return (
    <div className="w-full max-w-sm px-4">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold">{t.resetPassword.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.resetPassword.description}</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
