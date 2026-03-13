import { APP_URL } from '@/lib/constants'

// Escapa caracteres HTML para prevenir XSS em templates de email
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const PREFERENCES_URL = `${APP_URL}/settings?tab=notifications`

// Layout base responsivo — inline CSS obrigatório para compatibilidade com clientes de email
const EMAIL_STYLES = {
  container:
    'font-family: Inter, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FFFFFF;',
  header: 'text-align: center; padding-bottom: 24px; border-bottom: 1px solid #E5E7EB;',
  logo: 'font-size: 20px; font-weight: 700; color: #0F172A;',
  heading: 'font-size: 24px; font-weight: 700; color: #0F172A; margin: 24px 0 8px;',
  body: 'color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 16px;',
  button:
    'display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;',
  footer:
    'border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 16px; color: #94A3B8; font-size: 12px; text-align: center;',
  muted: 'color: #94A3B8; font-size: 14px; margin-top: 24px;',
} as const

function wrapLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background: #F8FAFC;">
      <div style="${EMAIL_STYLES.container}">
        <div style="${EMAIL_STYLES.header}">
          <span style="${EMAIL_STYLES.logo}">ultra-ia</span>
        </div>
        ${content}
        <div style="${EMAIL_STYLES.footer}">
          <p>ultra-ia — Votre expert IA spécialisé</p>
          <p><a href="${PREFERENCES_URL}" style="color: #94A3B8;">Gérer mes préférences email</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function welcomeTemplate(vars: { userName: string; dashboardUrl: string }): {
  subject: string
  html: string
} {
  const safeUserName = escapeHtml(vars.userName)
  const content = `
    <h1 style="${EMAIL_STYLES.heading}">Bienvenue sur ultra-ia !</h1>
    <p style="${EMAIL_STYLES.body}">
      Bonjour ${safeUserName},<br><br>
      Votre compte a été créé avec succès. Vous pouvez dès maintenant découvrir
      nos experts IA spécialisés et commencer vos premières consultations.
    </p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${vars.dashboardUrl}" style="${EMAIL_STYLES.button}">Accéder au tableau de bord</a>
    </p>
    <p style="${EMAIL_STYLES.muted}">
      Si vous n'avez pas créé ce compte, veuillez ignorer cet email.
    </p>
  `
  return {
    subject: 'Bienvenue sur ultra-ia !',
    html: wrapLayout(content),
  }
}

export function subscriptionConfirmationTemplate(vars: {
  userName: string
  specialistName: string
  amount: string
  nextBillingDate: string
  chatUrl: string
}): { subject: string; html: string } {
  const safeUserName = escapeHtml(vars.userName)
  const safeSpecialistName = escapeHtml(vars.specialistName)
  const safeAmount = escapeHtml(vars.amount)
  const safeNextBillingDate = escapeHtml(vars.nextBillingDate)
  const content = `
    <h1 style="${EMAIL_STYLES.heading}">Abonnement confirmé</h1>
    <p style="${EMAIL_STYLES.body}">
      Bonjour ${safeUserName},<br><br>
      Votre abonnement à <strong>${safeSpecialistName}</strong> est maintenant actif.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; color: #6B7280;">Spécialiste</td><td style="padding: 8px 0; font-weight: 600;">${safeSpecialistName}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Montant mensuel</td><td style="padding: 8px 0; font-weight: 600;">${safeAmount}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Prochaine facturation</td><td style="padding: 8px 0; font-weight: 600;">${safeNextBillingDate}</td></tr>
    </table>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${vars.chatUrl}" style="${EMAIL_STYLES.button}">Démarrer une conversation</a>
    </p>
  `
  return {
    subject: `Abonnement confirmé — ${safeSpecialistName}`,
    html: wrapLayout(content),
  }
}

export function paymentFailedTemplate(vars: {
  userName: string
  specialistName: string
  amount: string
  gracePeriodEnd: string
  billingUrl: string
}): { subject: string; html: string } {
  const safeUserName = escapeHtml(vars.userName)
  const safeSpecialistName = escapeHtml(vars.specialistName)
  const safeAmount = escapeHtml(vars.amount)
  const safeGracePeriodEnd = escapeHtml(vars.gracePeriodEnd)
  const content = `
    <h1 style="${EMAIL_STYLES.heading}">Problème de paiement</h1>
    <p style="${EMAIL_STYLES.body}">
      Bonjour ${safeUserName},<br><br>
      Le renouvellement de votre abonnement à <strong>${safeSpecialistName}</strong> a échoué.
      Votre accès reste actif jusqu'au <strong>${safeGracePeriodEnd}</strong>.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; color: #6B7280;">Spécialiste</td><td style="padding: 8px 0; font-weight: 600;">${safeSpecialistName}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Montant non prélevé</td><td style="padding: 8px 0; font-weight: 600;">${safeAmount}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Accès jusqu'au</td><td style="padding: 8px 0; font-weight: 600;">${safeGracePeriodEnd}</td></tr>
    </table>
    <p style="${EMAIL_STYLES.body}">
      Veuillez mettre à jour votre méthode de paiement pour continuer à utiliser le service.
    </p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${vars.billingUrl}" style="${EMAIL_STYLES.button}">Mettre à jour le paiement</a>
    </p>
    <p style="${EMAIL_STYLES.muted}">
      Si vous ne mettez pas à jour avant le ${safeGracePeriodEnd}, votre accès au chat sera suspendu.
    </p>
  `
  return {
    subject: 'Action requise — Problème de paiement',
    html: wrapLayout(content),
  }
}

export function paymentUpdatedTemplate(vars: {
  userName: string
  amount: string
  nextBillingDate: string
  chatUrl: string
}): { subject: string; html: string } {
  const safeUserName = escapeHtml(vars.userName)
  const safeAmount = escapeHtml(vars.amount)
  const safeNextBillingDate = escapeHtml(vars.nextBillingDate)
  const content = `
    <h1 style="${EMAIL_STYLES.heading}">Paiement confirmé</h1>
    <p style="${EMAIL_STYLES.body}">
      Bonjour ${safeUserName},<br><br>
      Votre paiement pour ultra-ia a été traité avec succès.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; color: #6B7280;">Montant</td><td style="padding: 8px 0; font-weight: 600;">${safeAmount}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B7280;">Prochaine facturation</td><td style="padding: 8px 0; font-weight: 600;">${safeNextBillingDate}</td></tr>
    </table>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${vars.chatUrl}" style="${EMAIL_STYLES.button}">Reprendre la conversation</a>
    </p>
  `
  return {
    subject: 'Paiement confirmé — Accès rétabli',
    html: wrapLayout(content),
  }
}

export function passwordResetTemplate(vars: {
  userName: string
  resetUrl: string
}): { subject: string; html: string } {
  const safeUserName = escapeHtml(vars.userName)
  const content = `
    <h1 style="${EMAIL_STYLES.heading}">Réinitialisation du mot de passe</h1>
    <p style="${EMAIL_STYLES.body}">
      Bonjour ${safeUserName},<br><br>
      Vous avez demandé la réinitialisation de votre mot de passe ultra-ia.
      Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
      Ce lien expire dans <strong>1 heure</strong>.
    </p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${vars.resetUrl}" style="${EMAIL_STYLES.button}">Réinitialiser le mot de passe</a>
    </p>
    <p style="${EMAIL_STYLES.muted}">
      Si vous n'avez pas fait cette demande, ignorez cet email.
    </p>
  `
  return {
    subject: 'Réinitialisation de votre mot de passe',
    html: wrapLayout(content),
  }
}

// Mapa template → função geradora
export const templateFunctions: Record<
  string,
  (vars: Record<string, string>) => { subject: string; html: string }
> = {
  welcome: welcomeTemplate as (vars: Record<string, string>) => { subject: string; html: string },
  'subscription-confirmation': subscriptionConfirmationTemplate as (
    vars: Record<string, string>,
  ) => { subject: string; html: string },
  'payment-failed': paymentFailedTemplate as (vars: Record<string, string>) => {
    subject: string
    html: string
  },
  'payment-updated': paymentUpdatedTemplate as (vars: Record<string, string>) => {
    subject: string
    html: string
  },
  'password-reset': passwordResetTemplate as (vars: Record<string, string>) => {
    subject: string
    html: string
  },
}
