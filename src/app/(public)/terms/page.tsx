import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: `Conditions générales d'utilisation de ${APP_NAME}. Droits, responsabilités et règles d'utilisation de la plateforme.`,
  alternates: { canonical: `${APP_URL}/terms` },
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-prose px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
        {"Conditions Générales d'Utilisation"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : 11 mars 2026
      </p>

      <section className="mt-10 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          1. Description du Service
        </h2>
        <p className="text-foreground">
          {APP_NAME} est une plateforme SaaS (Software as a Service) qui met à disposition des
          utilisateurs un accès à des spécialistes IA dans divers domaines professionnels (droit,
          fiscalité, gestion {"d'entreprise"}, santé, etc.). Le service est accessible via
          abonnement mensuel.
        </p>
        <p className="text-foreground">
          La plateforme est éditée et exploitée par {APP_NAME}, accessible à{' '}
          <Link
            href="/"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            ultra-ia.fr
          </Link>
          .
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          2. Inscription et Compte
        </h2>
        <p className="text-foreground">
          Pour accéder au service, vous devez créer un compte en fournissant des informations
          exactes et complètes. Vous êtes responsable de :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>La confidentialité de vos identifiants de connexion</li>
          <li>Toute activité réalisée depuis votre compte</li>
          <li>La mise à jour de vos informations en cas de changement</li>
        </ul>
        <p className="text-foreground">
          Le service est réservé aux personnes majeures (18 ans et plus). En créant un compte,
          vous confirmez avoir {"l'âge"} requis et accepter les présentes conditions.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          3. Abonnement et Paiement
        </h2>
        <p className="text-foreground">
          {"L'accès"} au service est conditionné à la souscription {"d'un"} abonnement mensuel.
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Tarification :</strong> les tarifs sont indiqués sur la page{' '}
            <Link
              href="/#pricing"
              className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Tarifs
            </Link>{' '}
            et peuvent être modifiés avec un préavis de 30 jours
          </li>
          <li>
            <strong>Renouvellement automatique :</strong> {"l'abonnement"} se renouvelle
            automatiquement chaque mois à la date anniversaire de souscription
          </li>
          <li>
            <strong>Paiement :</strong> les paiements sont traités de manière sécurisée par Stripe
            — nous {"n'accédons"} pas à vos données bancaires
          </li>
          <li>
            <strong>Facturation :</strong> une facture est envoyée par email à chaque renouvellement
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          4. Utilisation du Service
        </h2>
        <p className="text-foreground">Le service est accessible pour un usage personnel et professionnel.</p>
        <p className="text-foreground">
          <strong>Limites {"d'utilisation"} :</strong> chaque compte est limité à 100 requêtes par
          jour aux spécialistes IA. Cette limite peut être modifiée en fonction de votre plan
          {"d'abonnement"}.
        </p>
        <p className="text-foreground">
          <strong>Utilisations interdites :</strong> il est strictement interdit de :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>Tenter de contourner les mesures de sécurité de la plateforme</li>
          <li>Utiliser le service à des fins illicites ou frauduleuses</li>
          <li>Reproduire, vendre ou exploiter commercialement le service sans autorisation</li>
          <li>Soumettre du contenu diffamatoire, abusif ou violant des droits de tiers</li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          5. Avertissement Important — Intelligence Artificielle
        </h2>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            ⚠️ {"L'IA ne remplace pas les professionnels certifiés"}
          </p>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Les réponses fournies par les spécialistes IA de {APP_NAME} ont un caractère
            informatif et éducatif uniquement. Elles <strong>ne constituent pas</strong> :
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <li>
              <strong>Un conseil juridique</strong> — consultez un avocat qualifié pour toute
              question légale
            </li>
            <li>
              <strong>Un conseil fiscal</strong> — consultez un expert-comptable ou conseiller
              fiscal agréé
            </li>
            <li>
              <strong>Un avis médical</strong> — consultez un médecin ou professionnel de santé
              agréé
            </li>
            <li>
              <strong>Un conseil financier</strong> — consultez un conseiller financier certifié
            </li>
          </ul>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            {APP_NAME} décline toute responsabilité pour les décisions prises sur la base des
            informations fournies par {"l'IA"} sans consultation préalable {"d'un"} professionnel
            certifié.
          </p>
        </div>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          6. Propriété Intellectuelle
        </h2>
        <p className="text-foreground">
          <strong>Contenu de la plateforme :</strong> {"l'ensemble"} des éléments de la plateforme
          (interface, design, algorithmes, modèles IA) est la propriété exclusive de {APP_NAME} et
          est protégé par le droit {"d'auteur"} français et international.
        </p>
        <p className="text-foreground">
          <strong>Contenu utilisateur :</strong> vous conservez la propriété de vos données et
          conversations. En utilisant le service, vous accordez à {APP_NAME} une licence limitée
          pour traiter ces données afin de fournir le service.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">7. Résiliation</h2>
        <p className="text-foreground">
          <strong>Par {"l'utilisateur"} :</strong> vous pouvez résilier votre abonnement à tout
          moment via le portail de gestion Stripe accessible depuis votre espace compte. La
          résiliation prend effet à la fin de la période {"d'abonnement"} en cours — aucun
          remboursement {"n'est"} effectué pour la période restante.
        </p>
        <p className="text-foreground">
          <strong>Par {APP_NAME} :</strong> nous nous réservons le droit de suspendre ou résilier
          votre compte en cas de violation des présentes conditions, sans préavis en cas de
          comportement grave, ou avec un préavis de 30 jours dans les autres cas.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          8. Limitation de Responsabilité
        </h2>
        <p className="text-foreground">
          Dans les limites permises par la loi, {APP_NAME} ne saurait être tenu responsable de :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            {"L'inexactitude"} ou {"l'incomplétude"} des informations fournies par {"l'IA"}
          </li>
          <li>
            Les décisions prises sur la base des réponses de {"l'IA"} sans consultation
            professionnelle
          </li>
          <li>
            Les interruptions temporaires du service pour maintenance ou incidents techniques
          </li>
          <li>{"Les dommages indirects résultant de l'utilisation du service"}</li>
        </ul>
        <p className="text-foreground">
          En tout état de cause, la responsabilité de {APP_NAME} est limitée au montant des sommes
          versées au titre des 12 derniers mois {"d'abonnement"}.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          9. Droit Applicable et Juridiction
        </h2>
        <p className="text-foreground">
          Les présentes conditions générales {"d'utilisation"} sont régies par le{' '}
          <strong>droit français</strong>. En cas de litige, les parties rechercheront une solution
          amiable. À défaut, le litige sera soumis à la compétence exclusive des{' '}
          <strong>tribunaux français compétents</strong>.
        </p>
        <p className="text-foreground">
          Pour les consommateurs résidant dans {"l'Union"} européenne, les règles impératives de
          protection des consommateurs applicables dans votre pays de résidence {"s'appliquent"}{' '}
          également.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">10. Contact</h2>
        <p className="text-foreground">
          Pour toute question relative aux présentes conditions, contactez-nous à :
        </p>
        <p className="text-foreground">
          <strong>Email :</strong>{' '}
          <a
            href="mailto:contact@ultra-ia.fr"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            contact@ultra-ia.fr
          </a>
        </p>
      </section>

      <div className="mt-10 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Voir également notre{' '}
          <Link
            href="/privacy"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Politique de Confidentialité
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
