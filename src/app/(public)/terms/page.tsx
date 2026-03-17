import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_URL, CONTACT_EMAIL } from '@/lib/constants';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.terms.metaTitle,
    description: t.terms.metaDesc,
    alternates: { canonical: `${APP_URL}/terms` },
  };
}

export default async function TermsPage() {
  const t = await getT();
  const tr = t.terms;
  const r = (s: string) => s.replace('{APP_NAME}', APP_NAME);

  return (
    <article className="mx-auto max-w-prose px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{tr.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{tr.lastUpdated}</p>

      <section className="mt-10 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s1Title}</h2>
        <p className="text-foreground">{r(tr.s1Text1)}</p>
        <p className="text-foreground">
          {r(tr.s1Text2Before)}{' '}
          <Link
            href="/"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            ultra-ia.fr
          </Link>
          {tr.s1Text2After}
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s2Title}</h2>
        <p className="text-foreground">{tr.s2Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>{tr.s2Item1}</li>
          <li>{tr.s2Item2}</li>
          <li>{tr.s2Item3}</li>
        </ul>
        <p className="text-foreground">{tr.s2Outro}</p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s3Title}</h2>
        <p className="text-foreground">{tr.s3Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>{tr.s3Item1Label}</strong> {tr.s3Item1TextBefore}{' '}
            <Link
              href="/#pricing"
              className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {tr.s3Item1LinkText}
            </Link>{' '}
            {tr.s3Item1TextAfter}
          </li>
          <li><strong>{tr.s3Item2Label}</strong> {tr.s3Item2Text}</li>
          <li><strong>{tr.s3Item3Label}</strong> {tr.s3Item3Text}</li>
          <li><strong>{tr.s3Item4Label}</strong> {tr.s3Item4Text}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s4Title}</h2>
        <p className="text-foreground">{tr.s4Text1}</p>
        <p className="text-foreground">
          <strong>{tr.s4Text2Label}</strong> {tr.s4Text2}
        </p>
        <p className="text-foreground">
          <strong>{tr.s4Text3Label}</strong> {tr.s4Text3}
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>{tr.s4Item1}</li>
          <li>{tr.s4Item2}</li>
          <li>{tr.s4Item3}</li>
          <li>{tr.s4Item4}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s5Title}</h2>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="font-semibold text-amber-900 dark:text-amber-100">{tr.s5Warning}</p>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{r(tr.s5Intro)}</p>
          <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <li><strong>{tr.s5Item1Label}</strong> {tr.s5Item1Text}</li>
            <li><strong>{tr.s5Item2Label}</strong> {tr.s5Item2Text}</li>
            <li><strong>{tr.s5Item3Label}</strong> {tr.s5Item3Text}</li>
            <li><strong>{tr.s5Item4Label}</strong> {tr.s5Item4Text}</li>
          </ul>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{r(tr.s5Disclaimer)}</p>
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s6Title}</h2>
        <p className="text-foreground">
          <strong>{tr.s6PlatformLabel}</strong> {r(tr.s6PlatformText)}
        </p>
        <p className="text-foreground">
          <strong>{tr.s6UserLabel}</strong> {r(tr.s6UserText)}
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s7Title}</h2>
        <p className="text-foreground">
          <strong>{tr.s7UserLabel}</strong> {tr.s7UserText}
        </p>
        <p className="text-foreground">
          <strong>{r(tr.s7CompanyLabel)}</strong> {tr.s7CompanyText}
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s8Title}</h2>
        <p className="text-foreground">{r(tr.s8Intro)}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>{tr.s8Item1}</li>
          <li>{tr.s8Item2}</li>
          <li>{tr.s8Item3}</li>
          <li>{tr.s8Item4}</li>
        </ul>
        <p className="text-foreground">{r(tr.s8Outro)}</p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s9Title}</h2>
        <p className="text-foreground">{tr.s9Text1}</p>
        <p className="text-foreground">{tr.s9Text2}</p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{tr.s10Title}</h2>
        <p className="text-foreground">{tr.s10Intro}</p>
        <p className="text-foreground">
          <strong>{tr.s10Email}</strong>{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>

      <div className="mt-10 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {tr.seeAlso}{' '}
          <Link
            href="/privacy"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {tr.privacyLink}
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
