'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { QuickPrompt } from '@/components/specialist/quick-prompt';
import { SubscribeButton } from '@/components/specialist/subscribe-button';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/use-t';

interface SpecialistCardProps {
  specialist: {
    id: string;
    name: string;
    slug: string;
    domain: string;
    description: string;
    accentColor: string;
    avatarUrl: string;
    tags: string[];
    quickPrompts: string[];
  };
  isAuthenticated?: boolean;
  hasActiveSubscription?: boolean;
}

export function SpecialistCard({
  specialist,
  isAuthenticated = false,
  hasActiveSubscription = false,
}: SpecialistCardProps) {
  const t = useT();
  const initials = specialist.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <article className="group relative overflow-hidden rounded-2xl border-4 border-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      {/* Gradient background using accent color */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${specialist.accentColor}cc 0%, ${specialist.accentColor}88 100%)`,
        }}
      />
      {/* Subtle SVG decoration lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute -left-16 -top-16 h-[70%] w-[300px] opacity-20"
          preserveAspectRatio="none"
          viewBox="0 0 780 1140"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: 'scaleX(-1) scaleY(-1)' }}
        >
          <path
            className="animate-[drawPath_2.5s_ease-out_0.3s_forwards]"
            d="M 225 0 C 1294.95 653.314 277.058 726.558 60 509.5 C -157.058 292.442 605.769 575.033 399 1140"
            fill="transparent"
            stroke="white"
            strokeDasharray="2420"
            strokeDashoffset="2420"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      {/* Inset highlight border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.1rem] z-10"
        style={{
          boxShadow:
            'rgba(255,255,255,0.5) 0px 2px 4px 0px inset, rgba(255,255,255,0.3) 0px -2px 4px 0px inset',
        }}
      />

      {/* Card content */}
      <div className="relative z-20 flex flex-col items-center gap-4 p-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="overflow-hidden avatar-xl-shadow"
            style={{ width: 80, height: 80, borderRadius: 20 }}
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={specialist.avatarUrl} alt={specialist.name} />
              <AvatarFallback
                className="text-lg font-semibold text-white"
                style={{ backgroundColor: specialist.accentColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Avatar inset highlight */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: 20,
              boxShadow:
                '0 2px 4px 0 rgba(255,255,255,0.50) inset, 0 -2px 4px 0 rgba(255,255,255,0.40) inset',
            }}
          />
        </div>

        {/* Info */}
        <div className="text-center">
          <h4 className="font-heading text-lg font-semibold text-white drop-shadow-sm">
            {specialist.name}
          </h4>
          <p className="text-sm text-white/80">{specialist.domain}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {specialist.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="category-glass" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Quick Prompts */}
        <div role="list" className="flex w-full flex-col gap-2">
          {specialist.quickPrompts.slice(0, 3).map((prompt) => (
            <QuickPrompt key={prompt} prompt={prompt} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-2 w-full">
          {!isAuthenticated ? (
            <Link
              href={`/register?callbackUrl=/specialist/${specialist.slug}?checkout=true`}
              aria-label={`${t.profile.startConversationAria} ${specialist.name}`}
              className={cn(buttonVariants({ variant: 'white', size: 'pill' }), 'w-full')}
            >
              {t.profile.startConversation}
            </Link>
          ) : (
            <SubscribeButton
              specialistId={specialist.id}
              hasActiveSubscription={hasActiveSubscription}
            />
          )}
        </div>
      </div>

      {/* Bottom gradual blur */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 z-10 gradual-blur" />
    </article>
  );
}
