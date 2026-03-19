import type { Metadata } from 'next';
import { CheckCircle2, XCircle } from 'lucide-react';

import { getPlatformSettings } from '@/actions/admin-settings-actions';
import { SettingsForm } from '@/components/admin/settings-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getT } from '@/lib/i18n/get-t';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.adminSettings.metaTitle };
}

function IntegrationRow({
  label,
  configured,
  configuredLabel,
  notConfiguredLabel,
}: {
  label: string;
  configured: boolean;
  configuredLabel: string;
  notConfiguredLabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      {configured ? (
        <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          {configuredLabel}
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 border-red-500/30 text-red-500">
          <XCircle className="h-3 w-3" />
          {notConfiguredLabel}
        </Badge>
      )}
    </div>
  );
}

export default async function AdminSettingsPage() {
  const t = await getT();
  const settings = await getPlatformSettings();

  const integrations = [
    { label: 'Anthropic API Key', configured: !!process.env.ANTHROPIC_API_KEY },
    { label: 'Stripe Secret Key', configured: !!process.env.STRIPE_SECRET_KEY },
    { label: 'Stripe Webhook Secret', configured: !!process.env.STRIPE_WEBHOOK_SECRET },
    { label: 'Resend API Key', configured: !!process.env.RESEND_API_KEY },
    {
      label: 'Google OAuth',
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    { label: 'N8N Webhook', configured: !!process.env.N8N_WEBHOOK_URL },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.adminSettings.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.adminSettings.subtitle}</p>
      </div>

      <SettingsForm initialSettings={settings} />

      {/* Integrations — server-rendered, read-only */}
      <Card>
        <CardHeader>
          <CardTitle>{t.adminSettings.integrationsTitle}</CardTitle>
          <CardDescription>{t.adminSettings.integrationsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {integrations.map((integration) => (
            <IntegrationRow
                key={integration.label}
                {...integration}
                configuredLabel={t.adminSettings.configured}
                notConfiguredLabel={t.adminSettings.notConfigured}
              />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
