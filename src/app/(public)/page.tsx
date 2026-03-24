import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Bot, CheckCircle2, MessageCircle, Sparkles, Zap } from 'lucide-react';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/constants';
import { getT } from '@/lib/i18n/get-t';
import { SpecialistCard } from '@/components/specialist/specialist-card';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.landing.metaTitle,
    description: t.landing.metaDesc,
    openGraph: {
      title: t.landing.metaTitle,
      description: t.landing.metaDesc,
      url: APP_URL,
      siteName: 'ultra-ia',
      images: [{ url: '/images/og/landing.webp', width: 1200, height: 630 }],
      type: 'website',
    },
  };
}

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

  if (session?.user?.role === 'EXPERT') {
    redirect('/expert/dashboard');
  }

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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 md:py-32">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2">
              <Sparkles className="h-4 w-4 text-[#0367fb]" />
              <span className="text-sm font-medium text-[#0367fb]">{t.landing.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="display-1 max-w-4xl text-gray-900">
              {t.landing.heroTitle.split(',')[0]},
              <br />
              <span className="text-[#0367fb]">disponible 24h/24</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-2xl text-lg text-gray-600 md:text-xl">
              {t.landing.heroDesc}
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#specialists"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#0367fb] px-8 font-semibold text-white transition-all hover:bg-[#0550c8]"
              >
                {t.landing.discover}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-8 font-semibold text-gray-700 transition-all hover:bg-gray-50"
              >
                {t.landing.demo}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mb-14 text-center">
            <h2 className="display-2 text-gray-900">
              Pourquoi choisir <span className="text-[#0367fb]">ultra-ia</span> ?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Une plateforme conçue pour vous accompagner au quotidien
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Bot,
                title: t.landing.feature1Title,
                desc: t.landing.feature1Desc,
              },
              {
                icon: Zap,
                title: t.landing.feature2Title,
                desc: t.landing.feature2Desc,
              },
              {
                icon: CheckCircle2,
                title: t.landing.feature3Title,
                desc: t.landing.feature3Desc,
              },
              {
                icon: MessageCircle,
                title: 'Disponible 24/7',
                desc: 'Accès illimité à vos experts, jour et nuit, 7 jours sur 7',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <feature.icon className="h-6 w-6 text-[#0367fb]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mb-14 text-center">
            <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-[#0367fb]">
              Comment ça marche
            </span>
            <h2 className="display-2 text-gray-900">Simple comme bonjour</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Choisissez votre expert',
                desc: 'Parcourez notre catalogue et sélectionnez le spécialiste adapté à vos besoins',
              },
              {
                step: '02',
                title: 'Posez vos questions',
                desc: 'Discutez en temps réel avec votre expert IA et obtenez des réponses personnalisées',
              },
              {
                step: '03',
                title: "Passez à l'action",
                desc: 'Appliquez les conseils de votre expert et atteignez vos objectifs plus rapidement',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0367fb] text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialists */}
      <section id="specialists" className="py-24 md:py-32">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6">
          <div className="mb-20 text-center">
            <span className="mb-4 inline-block rounded-full bg-[#0367fb]/10 px-5 py-2 text-sm font-semibold text-[#0367fb]">
              {t.landing.catalogBadge}
            </span>
            <h2 className="display-2 text-gray-900">{t.landing.sectionTitle}</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-500">
              Des spécialistes dans chaque domaine pour répondre à vos besoins
            </p>
          </div>

          {specialists.length > 0 ? (
            <div className="space-y-24 md:space-y-32">
              {specialists.map((specialist, index) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  isAuthenticated={!!userId}
                  hasActiveSubscription={activeSubscriptionIds.has(specialist.id)}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-3xl bg-gray-50 p-12 text-center">
              <Bot className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-xl font-medium text-gray-500">{t.landing.comingSoon}</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0367fb] py-20 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 text-center md:px-6">
          <h2 className="display-2 text-white">{t.landing.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{t.landing.ctaDesc}</p>

          <Link
            href="/register"
            className="group mt-10 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-8 font-semibold text-[#0367fb] transition-all hover:bg-gray-100"
          >
            {t.landing.ctaButton}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <p className="mt-6 text-sm text-white/60">
            Inscription gratuite. Aucune carte de crédit requise.
          </p>
        </div>
      </section>
    </>
  );
}
