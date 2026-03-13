import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { APP_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button-variants';

export const metadata: Metadata = {
  title: 'Tarifs | ultra-ia',
  description: 'Accédez à votre expert IA pour 99€/mois. Annulation à tout moment.',
  alternates: {
    canonical: `${APP_URL}/pricing`,
  },
  openGraph: {
    title: 'Tarifs | ultra-ia',
    description: 'Expert IA spécialisé disponible 24h/24 pour 99€/mois.',
    url: `${APP_URL}/pricing`,
    siteName: 'ultra-ia',
    type: 'website',
    locale: 'fr_FR',
  },
};

const benefits = [
  'Accès 24h/24, 7j/7 à votre expert IA',
  'Questions illimitées (dans la limite journalière)',
  'Historique complet de vos conversations',
  'Réponses personnalisées selon votre contexte',
  'Expert spécialisé dans votre domaine',
];

const faqs = [
  {
    value: 'payment',
    question: 'Comment fonctionne le paiement ?',
    answer: 'Paiement sécurisé via Stripe. Votre carte est débitée mensuellement au même jour.',
  },
  {
    value: 'cancel',
    question: 'Puis-je annuler à tout moment ?',
    answer:
      'Oui, depuis votre espace "Facturation". L\'accès reste actif jusqu\'à la fin de la période payée.',
  },
  {
    value: 'commitment',
    question: 'Y a-t-il un engagement ?',
    answer: 'Aucun engagement. Abonnement mensuel résiliable à tout moment sans frais.',
  },
  {
    value: 'missed-payment',
    question: 'Que se passe-t-il si je rate un paiement ?',
    answer:
      "Vous bénéficiez d'une période de grâce. Nous vous contactons avant toute interruption de service.",
  },
  {
    value: 'data-security',
    question: 'Les données de ma conversation sont-elles sécurisées ?',
    answer:
      'Oui, vos conversations sont chiffrées. Vous pouvez demander leur suppression à tout moment (conformité RGPD).',
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Tarifs simples et transparents
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Votre expert IA spécialisé, disponible à tout moment pour{' '}
          <span className="font-semibold text-foreground">99€/mois</span>.
        </p>
      </section>

      {/* Pricing Card */}
      <section aria-labelledby="pricing-card-heading" className="mb-16 flex justify-center">
        <Card className="w-full max-w-[400px]">
          <CardHeader className="border-b pb-4">
            <p
              id="pricing-card-heading"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Expert IA
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-heading text-5xl font-bold text-foreground">99€</span>
              <span className="text-lg text-muted-foreground">/mois</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3" aria-label="Avantages inclus">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <CheckCircle
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col items-center gap-2">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'default', size: 'lg' }),
                  'min-h-[44px] w-full justify-center'
                )}
              >
                Commencer
              </Link>
              <p className="text-xs text-muted-foreground">
                Annulation à tout moment. Aucun engagement.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-2xl">
        <h2
          id="faq-heading"
          className="mb-8 text-center font-heading text-2xl font-bold text-foreground"
        >
          Questions fréquentes
        </h2>
        <Accordion multiple={false}>
          {faqs.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
