import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { SessionProvider } from '@/components/shared/session-provider';
import { CookieConsent } from '@/components/shared/cookie-consent';
import { poppins, inter } from '@/lib/fonts';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(APP_URL),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <TooltipProvider>
              <a href="#main-content" className="skip-link">
                Aller au contenu principal
              </a>
              {children}
              <Toaster />
              <CookieConsent />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
