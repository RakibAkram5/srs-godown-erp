import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

const vendorBody = z.object({
  name: z.string().trim().min(1, 'Vendor name is required').max(120),
  phone: optionalString,
  email: z.string().email('Enter a valid email').optional().or(z.literal('')).nullable(),
  address: optionalString,
  openingBalance: z.coerce.number().default(0),
  isActive: z.boolean().optional().default(true),
});

export const createVendorSchema = z.object({ body: vendorBody });
export const updateVendorSchema = z.object({ body: vendorBody });
export const vendorStatusSchema = z.object({ body: z.object({ isActive: z.boolean() }) });

export type VendorInput = z.infer<typeof vendorBody>;
