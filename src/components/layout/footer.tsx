'use client';

import Link from 'next/link';
import { APP_NAME, CONTACT_EMAIL } from '@/lib/constants';
import { useT } from '@/lib/i18n/use-t';

export function Footer() {
  const t = useT();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-12 lg:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="font-heading text-lg font-bold text-primary">
              {APP_NAME}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">{t.footer.tagline}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 block text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Useful links */}
          <nav aria-label={t.footer.usefulLinksAria}>
            <p className="text-sm font-semibold text-foreground">{t.footer.usefulLinks}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/#specialists"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.footer.experts}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.footer.pricing}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal links */}
          <nav aria-label={t.footer.legalAria}>
            <p className="text-sm font-semibold text-foreground">{t.footer.legal}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {currentYear} {APP_NAME}. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
