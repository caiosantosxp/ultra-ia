'use client';

import Link from 'next/link';
import { APP_NAME, CONTACT_EMAIL } from '@/lib/constants';
import { useT } from '@/lib/i18n/use-t';

/**
 * NexAgent Design System — Footer
 * Clean light footer
 */
export function Footer() {
  const t = useT();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-[1280px] px-4 py-16 lg:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="text-xl font-bold text-[#0367fb]">
              {APP_NAME}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">{t.footer.tagline}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-[#0367fb] transition-colors hover:text-[#0550c8]"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Useful links */}
          <nav aria-label={t.footer.usefulLinksAria}>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              {t.footer.usefulLinks}
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/#specialists"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  {t.footer.experts}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  {t.footer.pricing}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal links */}
          <nav aria-label={t.footer.legalAria}>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              {t.footer.legal}
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                >
                  {t.footer.terms}
                </Link>
              </li>
            </ul>
          </nav>

          {/* CTA */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              {t.footer.getStarted || 'Get Started'}
            </p>
            <div className="mt-4">
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0367fb] px-6 text-sm font-medium text-white transition-all hover:bg-[#0550c8]"
              >
                {t.footer.createAccount || 'Create Account'}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {currentYear} {APP_NAME}. {t.footer.rights}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              {t.footer.privacy}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
