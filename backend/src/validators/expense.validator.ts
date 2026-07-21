import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

const expenseBody = z.object({
  category: z.string().trim().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  expenseDate: z.coerce.date().optional(),
  method: z.enum(['CASH', 'BANK', 'CARD', 'CHEQUE', 'OTHER']).default('CASH'),
  description: optionalString,
  notes: optionalString,
});

export const createExpenseSchema = z.object({ body: expenseBody });
export const updateExpenseSchema = z.object({ body: expenseBody });

export type ExpenseInput = z.infer<typeof expenseBody>;
