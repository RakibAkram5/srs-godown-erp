import { z } from 'zod';

const purchaseItem = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string().min(1),
  quantity: z.coerce.number().int('Quantity must be a whole number').positive('Quantity must be greater than 0'),
  purchasePrice: z.coerce.number().min(0, 'Price cannot be negative'),
  discount: z.coerce.number().min(0).default(0),
});

const purchaseBody = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  purchaseDate: z.coerce.date().optional(),
  warehouse: z.string().trim().optional().or(z.literal('')).nullable(),
  rack: z.string().trim().optional().or(z.literal('')).nullable(),
  shelf: z.string().trim().optional().or(z.literal('')).nullable(),
  discount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  notes: z.string().trim().optional().or(z.literal('')).nullable(),
  status: z.enum(['DRAFT', 'COMPLETED']).default('DRAFT'),
  items: z.array(purchaseItem).min(1, 'Add at least one product'),
});

export const createPurchaseSchema = z.object({ body: purchaseBody });
export const updatePurchaseSchema = z.object({ body: purchaseBody });

const returnItem = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  price: z.coerce.number().min(0),
});

export const createReturnSchema = z.object({
  body: z.object({
    purchaseId: z.string().min(1, 'Purchase is required'),
    returnDate: z.coerce.date().optional(),
    notes: z.string().trim().optional().or(z.literal('')).nullable(),
    items: z.array(returnItem).min(1, 'Add at least one item to return'),
  }),
});

export type PurchaseInput = z.infer<typeof purchaseBody>;
export type PurchaseItemInput = z.infer<typeof purchaseItem>;
export type ReturnInput = z.infer<typeof createReturnSchema>['body'];
