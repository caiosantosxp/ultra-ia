import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: `Politique de confidentialité de ${APP_NAME}. Découvrez comment nous protégeons vos données personnelles conformément au RGPD.`,
  alternates: { canonical: `${APP_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-prose px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
        Politique de Confidentialité
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dernière mise à jour : 11 mars 2026
      </p>

      <section className="mt-10 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          1. Données Collectées
        </h2>
        <p className="text-foreground">
          Dans le cadre de la fourniture de nos services, {APP_NAME} collecte les données suivantes :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Données de compte :</strong> nom, adresse e-mail, mot de passe hashé
          </li>
          <li>
            <strong>Données de conversation :</strong> historique des échanges avec les spécialistes IA
            (anonymisées après suppression du compte)
          </li>
          <li>
            <strong>Données de paiement :</strong> traitées exclusivement par Stripe — nous ne
            stockons aucune donnée de carte bancaire
          </li>
          <li>
            <strong>Cookies fonctionnels :</strong> préférences de thème (clair/sombre),
            consentement aux cookies
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          2. Base Légale du Traitement
        </h2>
        <p className="text-foreground">
          Le traitement de vos données personnelles est fondé sur les bases légales suivantes,
          conformément au RGPD :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Votre consentement (Art. 6.1.a RGPD) :</strong> pour les cookies non essentiels
            et les communications marketing
          </li>
          <li>
            <strong>{"L'exécution du contrat"} (Art. 6.1.b RGPD) :</strong> pour la fourniture du
            service et la gestion de votre abonnement
          </li>
          <li>
            <strong>{"L'intérêt légitime"} (Art. 6.1.f RGPD) :</strong> pour la sécurité de la
            plateforme et la prévention des fraudes
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          3. Finalité du Traitement
        </h2>
        <p className="text-foreground">Vos données sont utilisées pour :</p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>Fournir et améliorer le service de consultation avec les spécialistes IA</li>
          <li>Gérer votre compte et votre abonnement</li>
          <li>Traiter les paiements via Stripe</li>
          <li>{"Vous envoyer des communications transactionnelles (confirmations, factures)"}</li>
          <li>Assurer la sécurité et prévenir les abus</li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          4. Vos Droits
        </h2>
        <p className="text-foreground">
          Conformément au RGPD, vous disposez des droits suivants concernant vos données
          personnelles :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Droit {"d'accès"} (Art. 15) :</strong> obtenir une copie de vos données
            personnelles
          </li>
          <li>
            <strong>Droit de rectification (Art. 16) :</strong> corriger des données inexactes
          </li>
          <li>
            <strong>Droit à {"l'effacement"} (Art. 17) :</strong> demander la suppression de vos
            données
          </li>
          <li>
            <strong>Droit à la portabilité (Art. 20) :</strong> recevoir vos données dans un format
            structuré
          </li>
          <li>
            <strong>Droit {"d'opposition"} (Art. 21) :</strong> vous opposer au traitement de vos
            données
          </li>
          <li>
            <strong>Droit à la limitation (Art. 18) :</strong> limiter le traitement de vos données
          </li>
        </ul>
        <p className="text-foreground">
          Pour exercer ces droits, contactez notre Délégué à la Protection des Données (DPO) à :{' '}
          <a
            href="mailto:dpo@ultra-ia.fr"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            dpo@ultra-ia.fr
          </a>
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">5. Cookies</h2>
        <p className="text-foreground">
          {"Nous utilisons uniquement des cookies fonctionnels essentiels au bon fonctionnement de la plateforme :"}
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Préférence de thème :</strong> mémorisation du mode clair/sombre (localStorage)
          </li>
          <li>
            <strong>Consentement aux cookies :</strong> mémorisation de votre choix (localStorage)
          </li>
          <li>
            <strong>Session utilisateur :</strong> maintien de votre connexion (cookie sécurisé)
          </li>
        </ul>
        <p className="text-foreground">
          Nous {"n'utilisons"} pas de cookies analytiques ou publicitaires dans cette version du
          service.
        </p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          6. Durée de Conservation
        </h2>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Données de compte :</strong> durée de {"l'abonnement"} + 1 an après résiliation
          </li>
          <li>
            <strong>Données de conversation :</strong> anonymisées dans les 30 jours suivant la
            suppression du compte
          </li>
          <li>
            <strong>Données de facturation :</strong> 10 ans (obligation légale comptable)
          </li>
          <li>
            <strong>Logs de sécurité :</strong> 12 mois
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          7. Transferts Internationaux
        </h2>
        <p className="text-foreground">
          Vos données peuvent être traitées par nos sous-traitants dans les conditions suivantes :
        </p>
        <ul className="ml-6 list-disc space-y-1 text-foreground">
          <li>
            <strong>Stripe (paiements) :</strong> États-Unis — couvert par des clauses contractuelles
            types (CCT) approuvées par la Commission européenne
          </li>
          <li>
            <strong>Vercel (hébergement) :</strong> Région EU — conformité RGPD garantie
          </li>
          <li>
            <strong>Neon (base de données) :</strong> Frankfurt, UE — aucun transfert hors UE
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          8. Contact DPO & Réclamations
        </h2>
        <p className="text-foreground">
          Pour toute question relative à vos données personnelles ou pour exercer vos droits,
          contactez notre Délégué à la Protection des Données :
        </p>
        <p className="text-foreground">
          <strong>Email :</strong>{' '}
          <a
            href="mailto:dpo@ultra-ia.fr"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            dpo@ultra-ia.fr
          </a>
        </p>
        <p className="text-foreground">
          Vous avez également le droit de déposer une réclamation auprès de la{' '}
          <strong>CNIL</strong> (Commission Nationale de {"l'Informatique"} et des Libertés) :{' '}
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
        <h2 className="font-heading text-xl font-semibold text-foreground">
          9. Modifications de la Politique
        </h2>
        <p className="text-foreground">
          Nous nous réservons le droit de modifier cette politique de confidentialité. En cas de
          modification substantielle, vous serez notifié par email au moins 30 jours avant
          {"l'entrée"} en vigueur des changements. La date de dernière mise à jour est indiquée en
          haut de cette page.
        </p>
      </section>

      <div className="mt-10 border-t pt-6">
        <p className="text-sm text-muted-foreground">
          Voir également nos{' '}
          <Link
            href="/terms"
            className="text-primary underline hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {"Conditions Générales d'Utilisation"}
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
