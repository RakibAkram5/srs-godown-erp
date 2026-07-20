import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { vendorService } from '@/services/vendor.service';

export const vendorController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query as Record<string, string | undefined>;
    return sendSuccess(res, await vendorService.list(search, status));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await vendorService.get(req.params.id));
  }),
  history: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await vendorService.history(req.params.id));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await vendorService.create(req.body), 'Vendor created', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await vendorService.update(req.params.id, req.body), 'Vendor updated');
  }),
  setStatus: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await vendorService.setStatus(req.params.id, req.body.isActive), 'Status updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await vendorService.remove(req.params.id);
    return sendSuccess(res, null, 'Vendor deleted');
  }),
};
