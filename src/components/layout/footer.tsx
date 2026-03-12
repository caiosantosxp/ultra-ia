import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
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
            <p className="mt-2 text-sm text-muted-foreground">
              Experts IA spécialisés disponibles 24h/24 pour vous accompagner.
            </p>
            <a
              href="mailto:contact@ultra-ia.com"
              className="mt-3 block text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              contact@ultra-ia.com
            </a>
          </div>

          {/* Useful links */}
          <nav aria-label="Liens utiles">
            <p className="text-sm font-semibold text-foreground">Liens utiles</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="#specialists"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Nos experts
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Tarifs
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal links */}
          <nav aria-label="Liens légaux">
            <p className="text-sm font-semibold text-foreground">Légal</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {"Conditions d'utilisation"}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © {currentYear} {APP_NAME}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
