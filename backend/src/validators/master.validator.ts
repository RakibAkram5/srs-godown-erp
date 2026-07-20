import { z } from 'zod';

// Categories & Brands share the same shape (name + description).
export const masterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(80, 'Name is too long'),
    description: z.string().max(300, 'Description is too long').optional().or(z.literal('')),
    isActive: z.boolean().optional(),
  }),
});

// Units have a short name instead of a description (e.g. "Piece" → "pcs").
export const unitSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(80, 'Name is too long'),
    shortName: z.string().max(20, 'Short name is too long').optional().or(z.literal('')),
    isActive: z.boolean().optional(),
  }),
});

export const statusSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export type MasterInput = z.infer<typeof masterSchema>['body'];
export type UnitInput = z.infer<typeof unitSchema>['body'];
