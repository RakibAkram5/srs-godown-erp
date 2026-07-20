import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    companyName: z.string().min(1).optional(),
    companyLogo: z.string().url().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    currency: z.string().min(1).optional(),
    language: z.string().min(1).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
