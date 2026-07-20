import { z } from 'zod';

export const BIKES = ['Honda', 'Sohrab', 'MCR', 'Deluxe', 'Leader', 'Qingqi'] as const;

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

// Shared product fields (used by create, update and import).
const productBase = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(120, 'Name is too long'),
  description: optionalString,
  image: z.string().optional().or(z.literal('')).nullable(),
  categoryId: optionalString,
  brandId: optionalString,
  unitId: optionalString,
  warehouse: optionalString,
  rack: optionalString,
  shelf: optionalString,
  bikes: z.array(z.enum(BIKES)).optional().default([]),
  purchasePrice: z.coerce.number().min(0, 'Purchase price cannot be negative').default(0),
  salePrice: z.coerce.number().min(0, 'Sale price cannot be negative').default(0),
  openingStock: z.coerce.number().int('Must be a whole number').min(0).default(0),
  minimumStock: z.coerce.number().int('Must be a whole number').min(0).default(0),
  currentStock: z.coerce.number().int('Must be a whole number').min(0).optional(),
  isActive: z.boolean().optional().default(true),
});

export const createProductSchema = z.object({ body: productBase });

export const updateProductSchema = z.object({ body: productBase });

export const productStatusSchema = z.object({
  body: z.object({ isActive: z.boolean() }),
});

export const importProductsSchema = z.object({
  body: z.object({
    products: z.array(productBase).min(1, 'No rows to import').max(1000, 'Too many rows at once'),
  }),
});

export type ProductInput = z.infer<typeof productBase>;
