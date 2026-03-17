import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_URL } from '@/lib/constants';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.privacy.metaTitle,
    description: t.privacy.metaDesc,
    alternates: { canonical: `${APP_URL}/privacy` },
  };
}

export default async function PrivacyPage() {
  const t = await getT();
  const p = t.privacy;

  return (
    <article className="mx-auto max-w-prose px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{p.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{p.lastUpdated}</p>

      <section className="mt-10 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s1Title}</h2>
        <p className="text-foreground">{p.s1Intro.replace('{APP_NAME}', APP_NAME)}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li><strong>{p.s1Item1Label}</strong> {p.s1Item1Text}</li>
          <li><strong>{p.s1Item2Label}</strong> {p.s1Item2Text}</li>
          <li><strong>{p.s1Item3Label}</strong> {p.s1Item3Text}</li>
          <li><strong>{p.s1Item4Label}</strong> {p.s1Item4Text}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s2Title}</h2>
        <p className="text-foreground">{p.s2Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li><strong>{p.s2Item1Label}</strong> {p.s2Item1Text}</li>
          <li><strong>{p.s2Item2Label}</strong> {p.s2Item2Text}</li>
          <li><strong>{p.s2Item3Label}</strong> {p.s2Item3Text}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s3Title}</h2>
        <p className="text-foreground">{p.s3Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>{p.s3Item1}</li>
          <li>{p.s3Item2}</li>
          <li>{p.s3Item3}</li>
          <li>{p.s3Item4}</li>
          <li>{p.s3Item5}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s4Title}</h2>
        <p className="text-foreground">{p.s4Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li><strong>{p.s4Item1Label}</strong> {p.s4Item1Text}</li>
          <li><strong>{p.s4Item2Label}</strong> {p.s4Item2Text}</li>
          <li><strong>{p.s4Item3Label}</strong> {p.s4Item3Text}</li>
          <li><strong>{p.s4Item4Label}</strong> {p.s4Item4Text}</li>
          <li><strong>{p.s4Item5Label}</strong> {p.s4Item5Text}</li>
          <li><strong>{p.s4Item6Label}</strong> {p.s4Item6Text}</li>
        </ul>
        <p className="text-foreground">
          {p.s4DPOText}{' '}
          <a
            href={`mailto:${DPO_EMAIL}`}
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {DPO_EMAIL}
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s5Title}</h2>
        <p className="text-foreground">{p.s5Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li><strong>{p.s5Item1Label}</strong> {p.s5Item1Text}</li>
          <li><strong>{p.s5Item2Label}</strong> {p.s5Item2Text}</li>
          <li><strong>{p.s5Item3Label}</strong> {p.s5Item3Text}</li>
        </ul>
        <p className="text-foreground">{p.s5NoCookies}</p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s6Title}</h2>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li><strong>{p.s6Item1Label}</strong> {p.s6Item1Text}</li>
          <li><strong>{p.s6Item2Label}</strong> {p.s6Item2Text}</li>
          <li><strong>{p.s6Item3Label}</strong> {p.s6Item3Text}</li>
          <li><strong>{p.s6Item4Label}</strong> {p.s6Item4Text}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s7Title}</h2>
        <p className="text-foreground">{p.s7Intro}</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li><strong>{p.s7Item1Label}</strong> {p.s7Item1Text}</li>
          <li><strong>{p.s7Item2Label}</strong> {p.s7Item2Text}</li>
          <li><strong>{p.s7Item3Label}</strong> {p.s7Item3Text}</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s8Title}</h2>
        <p className="text-foreground">{p.s8Intro}</p>
        <p className="text-foreground">
          <strong>{p.s8Email}</strong>{' '}
          <a
            href={`mailto:${DPO_EMAIL}`}
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {DPO_EMAIL}
          </a>
        </p>
        <p className="text-foreground">
          {p.s8CNILText}{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            www.cnil.fr
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">{p.s9Title}</h2>
        <p className="text-foreground">{p.s9Text}</p>
      </section>

      <div className="mt-10 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {p.seeAlso}{' '}
          <Link
            href="/terms"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {p.termsLink}
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
