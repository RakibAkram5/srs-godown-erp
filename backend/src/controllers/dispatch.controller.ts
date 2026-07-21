import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { dispatchService, DispatchListQuery } from '@/services/dispatch.service';

export const dispatchController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dispatchService.list(req.query as DispatchListQuery));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dispatchService.create(req.body), 'Dispatch recorded', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dispatchService.update(req.params.id, req.body), 'Dispatch updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await dispatchService.remove(req.params.id);
    return sendSuccess(res, null, 'Dispatch deleted');
  }),
};
