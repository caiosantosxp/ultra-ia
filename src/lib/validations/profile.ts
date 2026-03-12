import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
