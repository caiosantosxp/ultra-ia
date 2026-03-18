'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, MessageCircle, Star, Send } from 'lucide-react';
import type { Specialist } from '@prisma/client';

import { Badge } from '@/components/ui/badge';
import { QuickPrompt } from '@/components/specialist/quick-prompt';
import { SubscribeButton } from '@/components/specialist/subscribe-button';
import { useT } from '@/lib/i18n/use-t';

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

  const t = useT();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [imageError, setImageError] = useState(false);
  const priceFormatted = formatPrice(price);
  const firstName = name.split(' ')[0];

  function handleSendPrompt() {
    const text = inputValue.trim();
    if (!text) return;
    if (hasActiveSubscription) {
      router.push(`/chat?prompt=${encodeURIComponent(text)}`);
    } else if (isAuthenticated) {
      router.push(`/specialist/${slug}?checkout=true`);
    } else {
      router.push(`/register?callbackUrl=/specialist/${slug}&prompt=${encodeURIComponent(text)}`);
    }
  }

  const chatHref = hasActiveSubscription
    ? '/chat'
    : isAuthenticated
      ? `/specialist/${slug}?checkout=true`
      : `/register?callbackUrl=/specialist/${slug}?checkout=true`;

  return (
    <article role="article" className="flex flex-col gap-6 pb-8">
      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${accentColor}ee 0%, ${accentColor} 60%, ${accentColor}99 100%)`,
          minHeight: '200px',
        }}
      >
        {/* Back button */}
        <Link
          href="/"
          aria-label={t.profile.backAria}
          className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/35"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-end justify-between px-5 pb-5 pt-14">
          {/* Left: name + title + buttons */}
          <div className="z-10 flex flex-col gap-3">
            <div>
              <h1 className="font-heading text-4xl font-bold leading-tight text-white">{name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-white/80">{domain}</span>
                {tags[0] && (
                  <span className="rounded-full bg-emerald-400/90 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {tags[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Link
                href={chatHref}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow transition hover:bg-white/90"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {t.profile.chat}
              </Link>
            </div>
          </div>

          {/* Right: avatar + social proof */}
          <div className="z-10 flex flex-col items-end gap-2">
            {/* Subscriber count */}
            <div className="flex items-center gap-1.5 rounded-xl bg-black/20 px-2.5 py-1.5 backdrop-blur-sm">
              <div className="flex -space-x-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-4 rounded-full bg-white/50 ring-1 ring-white/70"
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-white">{t.profile.subscribers}</span>
            </div>

            {/* Avatar */}
            <div
              className="relative h-28 w-24 overflow-hidden rounded-xl shadow-lg"
              style={{ backgroundColor: `${accentColor}99` }}
            >
              {avatarUrl && !imageError ? (
                <Image
                  src={avatarUrl}
                  alt={`${name} - ${domain}`}
                  fill
                  className="object-cover"
                  priority
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-1 rounded-lg bg-black/20 px-2 py-1 backdrop-blur-sm">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="ml-0.5 text-xs text-white/90">4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tagline ── */}
      <div className="border-l-2 border-foreground/20 py-1 pl-4">
        <p className="font-serif text-xl italic leading-snug">{description.split('.')[0]}.</p>
      </div>

      {/* ── Bio ── */}
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>

      {/* ── Tags ── */}
      {tags.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tags.slice(1).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* ── Price card ── */}
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="text-2xl font-semibold">
          {priceFormatted}
          <span className="text-base font-normal text-muted-foreground">{t.profile.perMonth}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t.profile.unlimitedAccess} {name}</p>
      </div>

      {/* ── Quick prompts ── */}
      {quickPrompts.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t.profile.frequentQuestions}
          </p>
          <div className="flex flex-col gap-2">
            {quickPrompts.map((prompt) => (
              <QuickPrompt
                key={prompt}
                prompt={prompt}
                href={`/login?specialist=${slug}&prompt=${encodeURIComponent(prompt)}`}
                ariaLabel={`${t.profile.askQuestion} ${firstName}: ${prompt}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Main CTA ── */}
      {!isAuthenticated ? (
        <Link
          href={`/register?callbackUrl=/specialist/${slug}?checkout=true`}
          aria-label={`${t.profile.startConversationAria} ${name}`}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          {t.profile.startConversation}
        </Link>
      ) : (
        <SubscribeButton
          specialistId={specialist.id}
          hasActiveSubscription={hasActiveSubscription}
          autoCheckout={autoCheckout}
        />
      )}

      {/* ── Chat input ── */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
        className="flex items-center gap-3 rounded-full border bg-card px-4 py-2.5 shadow-sm"
      >
        <div
          className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full"
          style={{ backgroundColor: `${accentColor}99` }}
        >
          {avatarUrl && !imageError ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={28}
              height={28}
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white">
              {initials}
            </span>
          )}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={quickPrompts[0] ?? `${t.profile.askQuestion} ${firstName}…`}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          type="submit"
          aria-label={t.profile.chat}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </article>
  );
}
