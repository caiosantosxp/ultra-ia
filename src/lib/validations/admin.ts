import { z } from 'zod';

export const createSpecialistSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug invalide (lettres minuscules, chiffres, tirets)'),
  domain: z.string().min(2, 'Le domaine est requis').max(100),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(2000),
  price: z.number().int().min(100, 'Le prix minimum est 1€').max(100000),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide'),
  avatarUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  tags: z.array(z.string().min(1).max(50)).max(10),
  quickPrompts: z.array(z.string().min(1).max(200)).max(8),
  language: z.enum(['fr', 'en']),
  systemPrompt: z.string().max(10000).optional(),
  scopeLimits: z.string().max(5000).optional(),
  firstMessage: z.string().max(2000).optional(),
});

export const updateSpecialistSchema = createSpecialistSchema.partial();

export const fileUploadSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z
    .string()
    .refine(
      (t) =>
        [
          'application/pdf',
          'text/plain',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ].includes(t),
      'Formats acceptés: PDF, TXT, DOCX'
    ),
  fileSize: z.number().int().max(5 * 1024 * 1024, 'Taille maximum: 5 Mo'),
});

export type CreateSpecialistInput = z.infer<typeof createSpecialistSchema>;
export type UpdateSpecialistInput = z.infer<typeof updateSpecialistSchema>;
