import { z } from 'zod';

const saleItem = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string().min(1),
  quantity: z.coerce.number().int('Quantity must be a whole number').positive('Quantity must be greater than 0'),
  salePrice: z.coerce.number().min(0, 'Price cannot be negative'),
  discount: z.coerce.number().min(0).default(0),
});

const saleBody = z.object({
  customerName: z.string().trim().optional().or(z.literal('')).nullable(),
  customerPhone: z.string().trim().optional().or(z.literal('')).nullable(),
  saleDate: z.coerce.date().optional(),
  discount: z.coerce.number().min(0).default(0),
  taxType: z.enum(['NONE', 'PERCENT', 'FIXED']).default('NONE'),
  taxValue: z.coerce.number().min(0).default(0),
  notes: z.string().trim().optional().or(z.literal('')).nullable(),
  status: z.enum(['DRAFT', 'COMPLETED']).default('DRAFT'),
  items: z.array(saleItem).min(1, 'Add at least one product'),
});

export const createSaleSchema = z.object({ body: saleBody });
export const updateSaleSchema = z.object({ body: saleBody });

const returnItem = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  price: z.coerce.number().min(0),
});

export const createSaleReturnSchema = z.object({
  body: z.object({
    saleId: z.string().min(1, 'Sale is required'),
    returnDate: z.coerce.date().optional(),
    notes: z.string().trim().optional().or(z.literal('')).nullable(),
    items: z.array(returnItem).min(1, 'Add at least one item to return'),
  }),
});

export type SaleInput = z.infer<typeof saleBody>;
export type SaleReturnInput = z.infer<typeof createSaleReturnSchema>['body'];
