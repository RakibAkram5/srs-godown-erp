import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { notificationService } from '@/services/notification.service';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { role, permissions } = req.user!;
    return sendSuccess(res, await notificationService.list(role, permissions));
  }),
};
