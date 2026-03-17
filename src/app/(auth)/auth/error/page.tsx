import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.authError.metaTitle };
}

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const t = await getT();
  const { error } = await searchParams;

  const errorMessages = {
    OAuthAccountNotLinked: t.authError.OAuthAccountNotLinked,
    CredentialsSignin: t.authError.CredentialsSignin,
    OAuthSignin: t.authError.OAuthSignin,
    OAuthCallback: t.authError.OAuthCallback,
    SessionRequired: t.authError.SessionRequired,
  };

  const message =
    (error && errorMessages[error as keyof typeof errorMessages]) ?? t.authError.defaultError;

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-card p-8 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-bold">{t.authError.title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Link href="/login" className={buttonVariants()}>
        {t.authError.backToLogin}
      </Link>
    </div>
  );
}
