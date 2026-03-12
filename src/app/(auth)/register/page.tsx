import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Créez votre compte ultra-ia pour accéder aux spécialistes IA',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
