'use client';

import { useState } from 'react';

import { toast } from 'sonner';
import { Copy, Check, Send } from 'lucide-react';

import { updateSystemPrompt } from '@/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/use-t';

interface InstructionsFormProps {
  specialistId: string;
  initialPrompt: string | null;
}

export function InstructionsForm({ specialistId, initialPrompt }: InstructionsFormProps) {
  const t = useT();
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyId() {
    navigator.clipboard.writeText(specialistId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateSystemPrompt(specialistId, prompt);
    setSaving(false);

    if (result.success) {
      toast.success(t.instructionsPage.saveSuccess);
    } else {
      toast.error(result.error?.message ?? t.instructionsPage.saveError);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{t.instructionsPage.promptIdLabel}</p>
          <p className="font-mono text-xs mt-0.5 truncate text-foreground">{specialistId}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleCopyId} className="ml-2 shrink-0">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>{t.instructionsPage.systemPromptLabel}</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={16}
          placeholder={t.instructionsPage.systemPromptPlaceholder}
          className="font-mono text-xs resize-none"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Send className="h-4 w-4" />
          {saving ? t.instructionsPage.saving : t.instructionsPage.save}
        </Button>
      </div>
    </div>
  );
}
