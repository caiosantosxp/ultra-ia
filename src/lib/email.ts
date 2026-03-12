import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'noreply@ultra-ia.com',
    to: email,
    subject: 'Réinitialisation de votre mot de passe ultra-ia',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">
          Réinitialisation du mot de passe
        </h1>
        <p style="color: #475569; margin-bottom: 24px;">
          Vous avez demandé la réinitialisation de votre mot de passe ultra-ia.
          Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
          Ce lien expire dans <strong>1 heure</strong>.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563EB; color: white;
           padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Réinitialiser le mot de passe
        </a>
        <p style="color: #94A3B8; margin-top: 24px; font-size: 14px;">
          Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe ne sera pas modifié.
        </p>
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="color: #94A3B8; font-size: 12px;">ultra-ia — Votre expert IA spécialisé</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
