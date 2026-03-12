import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button-variants';
import { ChatHeroPreview } from '@/components/specialist/chat-hero-preview';
import { cn } from '@/lib/utils';
import { SpecialistCard } from '@/components/specialist/specialist-card';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/constants';

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
  const specialists = await getSpecialists();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h1 className="text-[2rem] font-bold leading-tight lg:text-4xl">
              Votre expert IA, disponible 24h/24
            </h1>
            <p className="text-lg text-muted-foreground lg:text-xl">
              Accédez à des spécialistes IA dans divers domaines. Des conseils personnalisés,
              adaptés à votre situation, à tout moment.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#specialists"
                className={cn(buttonVariants({ size: 'lg' }), 'min-h-11')}
              >
                Découvrir nos experts
              </Link>
              <Link
                href="#specialists"
                className={cn(buttonVariants({ size: 'lg', variant: 'outline' }), 'min-h-11')}
              >
                Voir la démo
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
        <h2 className="mb-8 text-center">Nos Experts IA</h2>

        {specialists.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialists.map((specialist) => (
              <SpecialistCard key={specialist.id} specialist={specialist} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            Nos experts arrivent bientôt...
          </p>
        )}
      </section>
    </>
  );
}
