'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { createSpecialist, updateSpecialist } from '@/actions/admin-actions';
import { createSpecialistSchema, type CreateSpecialistInput } from '@/lib/validations/admin';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/use-t';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface AgentFormProps {
  specialistId?: string;
  defaultValues?: Partial<CreateSpecialistInput>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgentForm({ specialistId, defaultValues, onSuccess, onCancel }: AgentFormProps) {
  const t = useT();
  const router = useRouter();
  const isEdit = !!specialistId;

  // H1 Fix: mode: 'onBlur' enables inline Zod validation on field blur (AC #2)
  const form = useForm<CreateSpecialistInput, unknown, CreateSpecialistInput>({
    resolver: zodResolver(createSpecialistSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      description: '',
      price: 990,
      accentColor: '#6366f1',
      avatarUrl: '',
      tags: [],
      quickPrompts: [],
      language: 'fr',
      systemPrompt: '',
      scopeLimits: '',
      ...defaultValues,
    },
  });

  async function onSubmit(data: CreateSpecialistInput) {
    // H2 Fix: data already contains validated tags/quickPrompts arrays from RHF
    const result = isEdit
      ? await updateSpecialist(specialistId, data)
      : await createSpecialist(data);

    if (result.success) {
      toast.success(isEdit ? t.agentForm.updateSuccess : t.agentForm.createSuccess);
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(result.error?.message ?? t.agentForm.errorDefault);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.agentForm.nameLabel}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t.agentForm.namePlaceholder}
                    onChange={(e) => {
                      field.onChange(e); // Ensure RHF tracks the change
                      if (!isEdit || !form.getValues('slug')) {
                        form.setValue('slug', generateSlug(e.target.value), {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.agentForm.slugLabel}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.agentForm.slugPlaceholder} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.agentForm.domainLabel}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.agentForm.domainPlaceholder} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.agentForm.priceLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    placeholder="990"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.agentForm.languageLabel}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t.agentForm.languagePlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fr">{t.agentForm.languageFr}</SelectItem>
                  <SelectItem value="en">{t.agentForm.languageEn}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.agentForm.descriptionLabel}</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder={t.agentForm.descriptionPlaceholder} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="accentColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.agentForm.accentColorLabel}</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-input"
                    />
                    <Input {...field} placeholder="#6366f1" className="font-mono" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.agentForm.avatarUrlLabel}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* H2 Fix: Tags now use FormField for proper Zod validation + FormMessage (AC #2, #8) */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.agentForm.tagsLabel}</FormLabel>
              <FormControl>
                <Input
                  value={field.value?.join(', ') ?? ''}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    field.onChange(tags);
                  }}
                  onBlur={field.onBlur}
                  placeholder={t.agentForm.tagsPlaceholder}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* H2 Fix: QuickPrompts now use FormField for proper Zod validation + FormMessage (AC #2, #8) */}
        <FormField
          control={form.control}
          name="quickPrompts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.agentForm.quickPromptsLabel}</FormLabel>
              <FormControl>
                <Textarea
                  value={field.value?.join('\n') ?? ''}
                  onChange={(e) => {
                    const prompts = e.target.value
                      .split('\n')
                      .map((p) => p.trim())
                      .filter(Boolean);
                    field.onChange(prompts);
                  }}
                  onBlur={field.onBlur}
                  rows={3}
                  placeholder={t.agentForm.quickPromptsPlaceholder}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="systemPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.agentForm.systemPromptLabel}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder={t.agentForm.systemPromptPlaceholder}
                  className="font-mono text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopeLimits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.agentForm.scopeLimitsLabel}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder={t.agentForm.scopeLimitsPlaceholder}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* M2 Fix: Annuler button added (AC Dev Notes) */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t.agentForm.cancel}
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? t.agentForm.saving
              : isEdit
                ? t.agentForm.save
                : t.agentForm.create}
          </Button>
        </div>
      </form>
    </Form>
  );
}
