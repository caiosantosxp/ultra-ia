import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import type { Metadata } from 'next';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/constants';
import { SpecialistProfile } from '@/components/specialist/specialist-profile';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkout?: string }>;
}

const getSpecialist = unstable_cache(
  async (slug: string) => {
    return prisma.specialist.findUnique({
      where: { slug, isActive: true },
    });
  },
  ['specialist'],
  { revalidate: 3600, tags: ['specialist'] }
);

export async function generateStaticParams() {
  try {
    const specialists = await prisma.specialist.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return specialists.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const specialist = await getSpecialist(slug);
  if (!specialist) return {};
  return {
    title: `${specialist.name} - Expert ${specialist.domain} | ultra-ia`,
    description: specialist.description.slice(0, 160),
    alternates: {
      canonical: `${APP_URL}/specialist/${specialist.slug}`,
    },
    openGraph: {
      title: `${specialist.name} - Expert ${specialist.domain}`,
      description: specialist.description.slice(0, 160),
      url: `${APP_URL}/specialist/${specialist.slug}`,
      images: [{ url: specialist.avatarUrl, width: 400, height: 400, alt: `${specialist.name} - Expert ${specialist.domain}` }],
      type: 'profile',
    },
  };
}

export default async function SpecialistPage({ params, searchParams }: Props) {
  const [{ slug }, { checkout }] = await Promise.all([params, searchParams]);
  const specialist = await getSpecialist(slug);
  if (!specialist) notFound();

  // Check auth and subscription status for CTA (AC #1, #9)
  const session = await auth();
  const userId = session?.user?.id;
  let hasActiveSubscription = false;
  if (userId) {
    const sub = await prisma.subscription.findUnique({
      where: { userId_specialistId: { userId, specialistId: specialist.id } },
      select: { status: true },
    });
    hasActiveSubscription = sub?.status === 'ACTIVE';
  }

  // Auto-trigger checkout param (FR4: post-registration redirect)
  const autoCheckout = checkout === 'true' && !!userId && !hasActiveSubscription;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: specialist.name,
    description: specialist.description,
    url: `${APP_URL}/specialist/${specialist.slug}`,
    image: specialist.avatarUrl,
    priceRange: `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(specialist.price / 100)}/mois`,
    areaServed: { '@type': 'Place', name: 'France' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\/script>/gi, '<\\/script>') }}
      />
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
        <SpecialistProfile
          specialist={specialist}
          isAuthenticated={!!userId}
          hasActiveSubscription={hasActiveSubscription}
          autoCheckout={autoCheckout}
        />
      </div>
    </>
  );
}
