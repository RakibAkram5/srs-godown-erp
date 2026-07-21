import { z } from 'zod';

const dispatchBody = z.object({
  saleId: z.string().min(1, 'Sale invoice is required'),
  biltyNumber: z.string().trim().min(1, 'Bilty number is required'),
  transporterName: z.string().trim().min(1, 'Transporter name is required'),
  city: z.string().trim().min(1, 'City is required'),
  dispatchDate: z.coerce.date().optional(),
  notes: z.string().trim().optional().or(z.literal('')).nullable(),
});

export const createDispatchSchema = z.object({ body: dispatchBody });

export type DispatchInput = z.infer<typeof dispatchBody>;
