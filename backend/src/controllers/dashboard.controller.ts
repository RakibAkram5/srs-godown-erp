import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { dashboardService } from '@/services/dashboard.service';

export const dashboardController = {
  stats: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dashboardService.stats(req.user!.role));
  }),
};
