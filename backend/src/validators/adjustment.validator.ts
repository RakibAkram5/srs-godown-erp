import { z } from 'zod';

export const adjustSchema = z.object({
  body: z.object({
    amount: z.coerce.number().refine((v) => v !== 0, 'Amount cannot be zero'),
    reason: z.string().trim().min(1, 'Reason is required'),
  }),
});
