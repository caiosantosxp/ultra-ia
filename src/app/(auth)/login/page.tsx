import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Se connecter',
  description: 'Connectez-vous à Ultra IA pour accéder à vos spécialistes IA',
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  return <LoginForm callbackError={error} />;
}
