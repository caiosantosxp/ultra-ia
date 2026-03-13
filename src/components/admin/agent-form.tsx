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
      toast.success(isEdit ? 'Agent mis à jour' : 'Agent créé avec succès');
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(result.error?.message ?? 'Une erreur est survenue');
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
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: Expert Juridique"
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
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="expert-juridique" />
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
                <FormLabel>Domaine</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Droit des affaires" />
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
                <FormLabel>Prix (centimes)</FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Description de l'agent..." />
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
                <FormLabel>{"Couleur d'accent"}</FormLabel>
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
                <FormLabel>URL de l'avatar</FormLabel>
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
              <FormLabel>Tags (séparés par des virgules)</FormLabel>
              <FormControl>
                <Input
                  value={field.value?.join(', ') ?? ''}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean);
                    field.onChange(tags);
                  }}
                  onBlur={field.onBlur}
                  placeholder="droit, contrats, entreprises"
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
              <FormLabel>Suggestions rapides (une par ligne)</FormLabel>
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
                  placeholder={"Comment rédiger un contrat ?\nQuelles sont mes obligations légales ?"}
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
              <FormLabel>System prompt</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder="Instructions système pour l'agent IA..."
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
              <FormLabel>Limites de portée</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Définissez les limites du domaine de l'agent..."
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
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? 'Enregistrement...'
              : isEdit
                ? 'Enregistrer'
                : "Créer l'agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
