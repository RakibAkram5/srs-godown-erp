import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { expenseService, ExpenseListQuery } from '@/services/expense.service';

export const expenseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await expenseService.list(req.query as ExpenseListQuery));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await expenseService.create(req.body), 'Expense added', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await expenseService.update(req.params.id, req.body), 'Expense updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await expenseService.remove(req.params.id);
    return sendSuccess(res, null, 'Expense deleted');
  }),
};
