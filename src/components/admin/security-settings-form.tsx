'use client';

import { useTransition } from 'react';
import { Shield } from 'lucide-react';

import { updateSecuritySettings } from '@/actions/expert-panel-actions';
import { cn } from '@/lib/utils';

interface SecuritySettings {
  showSources: boolean;
  showBranding: boolean;
  personalBranding: boolean;
  hideSidebar: boolean;
  requirePhone: boolean;
}

interface SecuritySettingsFormProps {
  specialistId: string;
  settings: SecuritySettings;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  preview?: React.ReactNode;
}

function SettingRow({ label, description, checked, onChange, preview }: SettingRowProps) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      {preview && <div>{preview}</div>}
    </div>
  );
}

export function SecuritySettingsForm({
  specialistId,
  settings: initialSettings,
}: SecuritySettingsFormProps) {
  const [settings, setSettings] = React.useState(initialSettings);
  const [, startTransition] = useTransition();

  function handleChange(key: keyof SecuritySettings, value: boolean) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    startTransition(async () => {
      await updateSecuritySettings(specialistId, { [key]: value });
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pb-2 text-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            +
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Parâmetros de segurança</h2>
          <p className="text-sm text-muted-foreground">
            Configure as exigências de segurança para os usuários
          </p>
        </div>
      </div>

      <SettingRow
        label="Exibição das fontes"
        description={`Mostrar as fontes nas respostas do expert`}
        checked={settings.showSources}
        onChange={(v) => handleChange('showSources', v)}
      />

      <SettingRow
        label="Exibição da marca"
        description="Mostrar a marca Ultra IA em todas as páginas do expert"
        checked={settings.showBranding}
        onChange={(v) => handleChange('showBranding', v)}
        preview={
          settings.showBranding ? (
            <div className="flex items-center justify-center rounded-lg border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-primary inline-block" />
              Desenvolvido por Ultra IA
            </div>
          ) : undefined
        }
      />

      <SettingRow
        label="Branding pessoal"
        description="Remova todas as referências à Ultra IA e use seu próprio logo"
        checked={settings.personalBranding}
        onChange={(v) => handleChange('personalBranding', v)}
      />

      <SettingRow
        label="Sidebar lateral"
        description="Retirar o painel lateral das interfaces de chat e integração"
        checked={settings.hideSidebar}
        onChange={(v) => handleChange('hideSidebar', v)}
      />

      <SettingRow
        label="Telefone obrigatório no cadastro"
        description="Solicitar aos usuários o número de telefone no cadastro"
        checked={settings.requirePhone}
        onChange={(v) => handleChange('requirePhone', v)}
      />
    </div>
  );
}

// Need React import for useState
import React from 'react';
