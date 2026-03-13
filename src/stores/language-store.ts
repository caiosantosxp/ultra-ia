import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale } from '@/lib/i18n';

interface LanguageStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: 'fr',
      setLocale: (locale) => {
        document.cookie = `LANG=${locale};path=/;max-age=31536000`;
        set({ locale });
      },
    }),
    { name: 'language-store' }
  )
);
