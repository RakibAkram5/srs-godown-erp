import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

const paymentBody = z.object({
  type: z.enum(['VENDOR_PAYMENT', 'DEALER_RECEIPT']),
  vendorId: optionalString,
  dealerId: optionalString,
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER']).default('CASH'),
  paymentDate: z.coerce.date().optional(),
  notes: optionalString,
});

export const createPaymentSchema = z.object({ body: paymentBody });

export type PaymentInput = z.infer<typeof paymentBody>;
