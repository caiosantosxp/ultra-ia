import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expert Panel | Ultra-IA',
  robots: { index: false, follow: false },
};

export default function ExpertGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
