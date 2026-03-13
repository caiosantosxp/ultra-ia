import { cookies } from 'next/headers';
import { fr, en } from '@/lib/i18n';

export async function getT() {
  const lang = (await cookies()).get('LANG')?.value ?? 'fr';
  return lang === 'en' ? en : fr;
}
