import { Request, Response } from 'express';
import { settingsService } from '@/services/settings.service';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';

export const settingsController = {
  get: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.get();
    return sendSuccess(res, settings);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.update(req.body);
    return sendSuccess(res, settings, 'Settings saved');
  }),
};
