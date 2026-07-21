import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

const dealerBody = z.object({
  name: z.string().trim().min(1, 'Dealer name is required').max(120),
  phone: optionalString,
  email: z.string().email('Enter a valid email').optional().or(z.literal('')).nullable(),
  address: optionalString,
  city: optionalString,
  openingBalance: z.coerce.number().default(0),
  isActive: z.boolean().optional().default(true),
});

export const createDealerSchema = z.object({ body: dealerBody });
export const updateDealerSchema = z.object({ body: dealerBody });
export const dealerStatusSchema = z.object({ body: z.object({ isActive: z.boolean() }) });

export type DealerInput = z.infer<typeof dealerBody>;
