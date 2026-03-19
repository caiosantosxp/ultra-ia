'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { updatePlatformSettings } from '@/actions/admin-settings-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/use-t';

type Settings = {
  openRegistration: boolean;
  requireExpertApproval: boolean;
  maintenanceMode: boolean;
  defaultLanguage: string;
};

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const [openRegistration, setOpenRegistration] = useState(initialSettings.openRegistration);
  const [requireExpertApproval, setRequireExpertApproval] = useState(
    initialSettings.requireExpertApproval
  );
  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.maintenanceMode);
  const [defaultLanguage, setDefaultLanguage] = useState(initialSettings.defaultLanguage);

  function handleSave() {
    startTransition(async () => {
      const result = await updatePlatformSettings({
        openRegistration,
        requireExpertApproval,
        maintenanceMode,
        defaultLanguage: defaultLanguage as 'fr' | 'en',
      });

      if (result.success) {
        toast.success(t.adminSettings.saveSuccess);
      } else {
        toast.error(t.adminSettings.saveError);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>{t.adminSettings.generalTitle}</CardTitle>
          <CardDescription>{t.adminSettings.generalDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t.adminSettings.defaultLanguageLabel}</p>
              <p className="text-muted-foreground text-sm">
                {t.adminSettings.defaultLanguageDescription}
              </p>
            </div>
            <Select value={defaultLanguage} onValueChange={(v) => v && setDefaultLanguage(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">{t.adminSettings.languageFr}</SelectItem>
                <SelectItem value="en">{t.adminSettings.languageEn}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Access & Registration */}
      <Card>
        <CardHeader>
          <CardTitle>{t.adminSettings.accessTitle}</CardTitle>
          <CardDescription>{t.adminSettings.accessDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t.adminSettings.openRegistrationLabel}</p>
              <p className="text-muted-foreground text-sm">
                {t.adminSettings.openRegistrationDescription}
              </p>
            </div>
            <Switch
              checked={openRegistration}
              onCheckedChange={setOpenRegistration}
              aria-label={t.adminSettings.openRegistrationLabel}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t.adminSettings.requireApprovalLabel}</p>
              <p className="text-muted-foreground text-sm">
                {t.adminSettings.requireApprovalDescription}
              </p>
            </div>
            <Switch
              checked={requireExpertApproval}
              onCheckedChange={setRequireExpertApproval}
              aria-label={t.adminSettings.requireApprovalLabel}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t.adminSettings.maintenanceModeLabel}</p>
              <p className="text-muted-foreground text-sm">
                {t.adminSettings.maintenanceModeDescription}
              </p>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              aria-label={t.adminSettings.maintenanceModeLabel}
            />
          </div>

          {maintenanceMode && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{t.adminSettings.maintenanceModeWarning}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t.adminSettings.saving : t.adminSettings.save}
        </Button>
      </div>
    </div>
  );
}
