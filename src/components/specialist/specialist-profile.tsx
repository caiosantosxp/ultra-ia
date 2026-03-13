import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { Specialist } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { QuickPrompt } from '@/components/specialist/quick-prompt';
import { SubscribeButton } from '@/components/specialist/subscribe-button';
import { cn } from '@/lib/utils';

interface SpecialistProfileProps {
  specialist: Specialist;
  isAuthenticated?: boolean;
  hasActiveSubscription?: boolean;
  autoCheckout?: boolean;
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(priceInCents / 100);
}

export function SpecialistProfile({
  specialist,
  isAuthenticated = false,
  hasActiveSubscription = false,
  autoCheckout = false,
}: SpecialistProfileProps) {
  const { name, slug, domain, description, accentColor, avatarUrl, tags, quickPrompts, price } =
    specialist;

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const priceFormatted = formatPrice(price);

  return (
    <article role="article" className="flex flex-col gap-6">
      {/* Task 8: Back navigation */}
      <Link
        href="/"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Nos Experts
      </Link>

      {/* Task 2.7: Avatar com next/image, responsive (Task 9.6) */}
      <div className="flex justify-center">
        <div
          className="relative h-24 w-24 overflow-hidden rounded-full ring-4 sm:h-[120px] sm:w-[120px]"
          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${name} - Expert ${domain}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Task 2.3: Nome (H1, Poppins 700) + Domain (H3) — Task 9.4 mobile scale */}
      <div className="text-center">
        <h1 className="font-heading text-[2rem] font-bold leading-tight sm:text-4xl">{name}</h1>
        <h2 className="mt-1 text-lg text-muted-foreground">{domain}</h2>
      </div>

      {/* Task 2.3: Descrição (Body Large) */}
      <p className="text-base leading-relaxed sm:text-lg">{description}</p>

      {/* Task 2.5: Tags (Badge outline, flex wrap) */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Task 2.4: Preço */}
      <div className="text-center">
        <p className="text-2xl font-semibold">
          {priceFormatted}
          <span className="text-lg font-normal text-muted-foreground">/mois</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Accès illimité à l&apos;expert</p>
      </div>

      {/* Task 3: Quick Prompts clicáveis — mobile horizontal scroll, desktop vertical */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-x-visible sm:px-0">
        <div className="flex gap-2 sm:flex-col">
          {quickPrompts.map((prompt) => (
            <div key={prompt} className="min-w-[220px] sm:min-w-0 sm:w-full">
              <QuickPrompt
                prompt={prompt}
                href={`/login?specialist=${slug}&prompt=${encodeURIComponent(prompt)}`}
                ariaLabel={`Poser la question: ${prompt}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA principal full-width */}
      <div className="mt-2">
        {!isAuthenticated ? (
          <Link
            href={`/register?callbackUrl=/specialist/${slug}?checkout=true`}
            aria-label={`Démarrer une conversation avec ${name}`}
            className={cn(
              buttonVariants(),
              'h-12 w-full rounded-xl text-base font-semibold'
            )}
          >
            Démarrer une conversation
          </Link>
        ) : (
          <SubscribeButton
            specialistId={specialist.id}
            hasActiveSubscription={hasActiveSubscription}
            autoCheckout={autoCheckout}
          />
        )}
      </div>
    </article>
  );
}
