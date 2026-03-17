export const APP_NAME = 'ultra-ia';
export const APP_DESCRIPTION =
  'Plateforme de consultation avec des spécialistes IA dans divers domaines';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const CONTACT_EMAIL = 'contact@ultra-ia.com';
export const DPO_EMAIL = 'dpo@ultra-ia.com';

if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
  console.warn('[ultra-ia] NEXT_PUBLIC_APP_URL is not set. Canonical URLs and JSON-LD will use http://localhost:3000.');
}
