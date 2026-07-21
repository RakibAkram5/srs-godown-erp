import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

const salaryBody = z.object({
  employeeName: z.string().trim().min(1, 'Employee name is required'),
  userId: optionalString,
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paidAmount: z.coerce.number().min(0).default(0),
  paymentDate: z.coerce.date().optional().nullable(),
  method: z.enum(['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER']).default('CASH'),
  notes: optionalString,
});

export const createSalarySchema = z.object({ body: salaryBody });
export const updateSalarySchema = z.object({ body: salaryBody });

export type SalaryInput = z.infer<typeof salaryBody>;
