import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.admin.expertPanelTitle,
    robots: { index: false, follow: false },
  };
}

export default function ExpertGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
