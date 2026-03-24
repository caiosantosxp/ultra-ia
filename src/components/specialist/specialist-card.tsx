'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SubscribeButton } from '@/components/specialist/subscribe-button';
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
  index?: number;
}

export function SpecialistCard({
  specialist,
  isAuthenticated = false,
  hasActiveSubscription = false,
  index = 0,
}: SpecialistCardProps) {
  const t = useT();
  const initials = specialist.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const isReversed = index % 2 === 1;

  return (
    <article
      className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16 ${isReversed ? 'lg:flex-row-reverse' : ''}`}
    >
      {/* Visual side */}
      <div className="relative flex-1">
        <div
          className="absolute -inset-4 rounded-[2rem] opacity-20 blur-2xl"
          style={{ backgroundColor: specialist.accentColor }}
        />
        <div
          className="relative overflow-hidden rounded-[2rem] p-8 md:p-12"
          style={{ backgroundColor: `${specialist.accentColor}08` }}
        >
          {/* Header */}
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
              <AvatarImage src={specialist.avatarUrl} alt={specialist.name} />
              <AvatarFallback
                className="text-2xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${specialist.accentColor}, ${specialist.accentColor}99)` }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600">En ligne</span>
              </div>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">{specialist.name}</h3>
              <p className="font-medium" style={{ color: specialist.accentColor }}>
                {specialist.domain}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {specialist.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <p className="mt-6 text-lg leading-relaxed text-gray-600">
            {specialist.description}
          </p>
        </div>
      </div>

      {/* Interactive side */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: specialist.accentColor }} />
          <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Posez vos questions
          </span>
        </div>

        <div className="space-y-4">
          {specialist.quickPrompts.map((prompt, i) => (
            <div
              key={i}
              className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <p className="text-gray-700">{prompt}</p>
              <div
                className="mt-3 flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: specialist.accentColor }}
              >
                <span>Commencer avec cette question</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          {!isAuthenticated ? (
            <Link
              href={`/register?callbackUrl=/specialist/${specialist.slug}?checkout=true`}
              aria-label={`${t.profile.startConversationAria} ${specialist.name}`}
              className="group inline-flex h-14 items-center gap-3 rounded-2xl px-8 text-lg font-semibold text-white transition-all hover:gap-4"
              style={{ backgroundColor: specialist.accentColor }}
            >
              <span>{t.profile.startConversation}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <SubscribeButton
              specialistId={specialist.id}
              hasActiveSubscription={hasActiveSubscription}
            />
          )}
        </div>
      </div>
    </article>
  );
}
