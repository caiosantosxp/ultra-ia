import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

/**
 * NexAgent Design System — Public Layout
 * Clean white background with subtle accents
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <Header />
      <main id="main-content" className="relative flex-1">{children}</main>
      <Footer />
    </div>
  );
}
