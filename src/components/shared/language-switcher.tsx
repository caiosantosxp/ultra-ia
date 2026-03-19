'use client';

import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/stores/language-store';
import { useT } from '@/lib/i18n/use-t';

export function LanguageSwitcher() {
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const t = useT();
  const router = useRouter();

  function toggle() {
    setLocale(locale === 'fr' ? 'en' : 'fr');
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      aria-label={t.nav.switchLanguageAriaLabel}
      className="flex h-9 w-14 items-center justify-center gap-0.5 rounded-md border bg-background text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <span className={locale === 'fr' ? 'text-foreground' : 'text-muted-foreground/50'}>FR</span>
      <span className="text-muted-foreground/30">|</span>
      <span className={locale === 'en' ? 'text-foreground' : 'text-muted-foreground/50'}>EN</span>
    </button>
  );
}
