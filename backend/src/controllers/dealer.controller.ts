import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { dealerService } from '@/services/dealer.service';

export const dealerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query as Record<string, string | undefined>;
    return sendSuccess(res, await dealerService.list(search, status));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dealerService.get(req.params.id));
  }),
  ledger: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dealerService.ledger(req.params.id));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dealerService.create(req.body), 'Dealer created', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dealerService.update(req.params.id, req.body), 'Dealer updated');
  }),
  setStatus: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await dealerService.setStatus(req.params.id, req.body.isActive), 'Status updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await dealerService.remove(req.params.id);
    return sendSuccess(res, null, 'Dealer deleted');
  }),
};
