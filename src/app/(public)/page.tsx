import type { Metadata } from 'next';
import Link from 'next/link';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/constants';
import { getT } from '@/lib/i18n/get-t';
import { buttonVariants } from '@/components/ui/button-variants';
import { ChatHeroPreview } from '@/components/specialist/chat-hero-preview';
import { SpecialistCard } from '@/components/specialist/specialist-card';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'ultra-ia | Votre Expert IA Spécialisé',
  description:
    'Accédez à des experts IA spécialisés disponibles 24h/24. Conseils personnalisés en gestion, finance, RH et plus encore.',
  openGraph: {
    title: 'ultra-ia | Votre Expert IA Spécialisé',
    description: 'Accédez à des experts IA spécialisés disponibles 24h/24.',
    url: APP_URL,
    siteName: 'ultra-ia',
    images: [{ url: '/images/og/landing.webp', width: 1200, height: 630 }],
    type: 'website',
    locale: 'fr_FR',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ultra-ia',
  url: APP_URL,
  description: 'Experts IA spécialisés disponibles 24h/24',
  logo: `${APP_URL}/images/og/landing.webp`,
};

async function getSpecialists() {
  try {
    return await prisma.specialist.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  } catch (e) {
    console.error('[getSpecialists] Failed to fetch specialists:', e);
    return [];
  }
}

export default async function HomePage() {
  const [specialists, session, t] = await Promise.all([getSpecialists(), auth(), getT()]);

  const userId = session?.user?.id;
  let activeSubscriptionIds = new Set<string>();
  if (userId && specialists.length > 0) {
    const subs = await prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE', specialistId: { in: specialists.map((s) => s.id) } },
      select: { specialistId: true },
    });
    activeSubscriptionIds = new Set(subs.map((s) => s.specialistId));
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="mx-auto max-w-[1280px] px-3 py-12 md:px-6 md:pt-4 md:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h1 className="text-[2.25rem] font-bold leading-tight tracking-tight lg:text-5xl">
              {t.landing.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              {t.landing.heroDesc}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#specialists"
                className={cn(buttonVariants({ size: 'pill' }), 'min-h-11')}
              >
                {t.landing.discover}
              </Link>
              <Link
                href="#specialists"
                className={cn(buttonVariants({ size: 'pill', variant: 'outline' }), 'min-h-11')}
              >
                {t.landing.demo}
              </Link>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <ChatHeroPreview />
          </div>
        </div>
      </section>

      {/* Specialist Catalog */}
      <section id="specialists" className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
        <h2 className="mb-8 text-center">{t.landing.sectionTitle}</h2>

        {specialists.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialists.map((specialist) => (
              <SpecialistCard
                key={specialist.id}
                specialist={specialist}
                isAuthenticated={!!userId}
                hasActiveSubscription={activeSubscriptionIds.has(specialist.id)}
              />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            {t.landing.comingSoon}
          </p>
        )}
      </section>
    </>
  );
}
