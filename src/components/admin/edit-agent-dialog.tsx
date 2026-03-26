'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AgentForm } from '@/components/admin/agent-form';
import { useT } from '@/lib/i18n/use-t';
import type { AgentRow } from '@/components/admin/agents-columns';

interface EditAgentDialogProps {
  agent: AgentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAgentDialog({ agent, open, onOpenChange }: EditAgentDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.editAgentDialog.title}</DialogTitle>
        </DialogHeader>
        <AgentForm
          specialistId={agent.id}
          defaultValues={{
            name: agent.name,
            slug: agent.slug,
            domain: agent.domain,
            description: agent.description,
            price: agent.price,
            accentColor: agent.accentColor,
            avatarUrl: agent.avatarUrl ?? '',
            tags: agent.tags,
            quickPrompts: agent.quickPrompts,
            language: agent.language as 'fr' | 'en',
            systemPrompt: agent.systemPrompt ?? '',
            scopeLimits: agent.scopeLimits ?? '',
            webhookUrl: agent.webhookUrl ?? '',
          }}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
