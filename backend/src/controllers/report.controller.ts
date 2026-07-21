import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { reportService, FinancialQuery, PendingLedgerQuery } from '@/services/report.service';

export const reportController = {
  financial: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await reportService.financial(req.query as FinancialQuery));
  }),
  pendingLedger: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await reportService.pendingLedger(req.query as PendingLedgerQuery));
  }),
};
