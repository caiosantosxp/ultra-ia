'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateFirstMessage } from '@/actions/expert-panel-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/use-t';

interface FirstMessageFormProps {
  specialistId: string;
  initialValue: string | null;
}

export function FirstMessageForm({ specialistId, initialValue }: FirstMessageFormProps) {
  const t = useT();
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateFirstMessage(specialistId, value);
      toast.success(t.firstMessageForm.saveSuccess);
    } catch {
      toast.error(t.firstMessageForm.saveError);
    } finally {
      setSaving(false);
    }
  }

  const charCount = value.length;
  const maxChars = 2000;

  return (
    <div className="max-w-3xl rounded-lg border p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{t.firstMessageForm.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.firstMessageForm.description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="first-message" className="text-sm">
          {t.firstMessageForm.label}
        </Label>
        <Textarea
          id="first-message"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.firstMessageForm.placeholder}
          rows={6}
          maxLength={maxChars}
          className="resize-none"
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{value ? t.firstMessageForm.customActive : t.firstMessageForm.defaultActive}</span>
          <span>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {value && (
        <div className="rounded-md border border-dashed p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t.firstMessageForm.preview}</p>
          <p className="text-sm whitespace-pre-wrap">{value}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? t.firstMessageForm.saving : t.firstMessageForm.save}
        </Button>
        {value && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setValue('')}
            disabled={saving}
          >
            {t.firstMessageForm.reset}
          </Button>
        )}
      </div>
    </div>
  );
}
