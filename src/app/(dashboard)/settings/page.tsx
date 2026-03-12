import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileForm } from '@/components/dashboard/profile-form';
import { RgpdSettings } from '@/components/settings/rgpd-settings';

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Gérez votre profil et vos préférences',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: { provider: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const isOAuthUser = user.accounts.some((account) => account.provider !== 'credentials');
  const oauthProvider = user.accounts.find(
    (account) => account.provider !== 'credentials',
  )?.provider;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading mb-6 text-2xl font-bold">Paramètres</h1>
      <div className="space-y-6">
        <ProfileForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          isOAuthUser={isOAuthUser}
          oauthProvider={oauthProvider}
        />
        <RgpdSettings />
      </div>
    </div>
  );
}
