import { z } from 'zod';

export const checkoutSchema = z.object({
  specialistId: z.string().min(1, 'Specialist ID is required'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
