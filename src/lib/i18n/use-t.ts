'use client';

import { useLanguageStore } from '@/stores/language-store';
import { fr, en } from '@/lib/i18n';

export function useT() {
  const locale = useLanguageStore((s) => s.locale);
  return locale === 'en' ? en : fr;
}
