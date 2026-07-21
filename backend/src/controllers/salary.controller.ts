import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { salaryService, SalaryListQuery } from '@/services/salary.service';

export const salaryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await salaryService.list(req.query as SalaryListQuery));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await salaryService.create(req.body), 'Salary record added', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await salaryService.update(req.params.id, req.body), 'Salary record updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await salaryService.remove(req.params.id);
    return sendSuccess(res, null, 'Salary record deleted');
  }),
};
