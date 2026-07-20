import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { purchaseService, PurchaseListQuery } from '@/services/purchase.service';

export const purchaseController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.list(req.query as PurchaseListQuery));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.get(req.params.id));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.create(req.body), 'Purchase saved', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.update(req.params.id, req.body), 'Purchase updated');
  }),
  complete: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.complete(req.params.id), 'Purchase completed — stock updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await purchaseService.remove(req.params.id);
    return sendSuccess(res, null, 'Purchase deleted');
  }),

  // Returns
  createReturn: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.createReturn(req.body), 'Return recorded — stock updated', 201);
  }),
  listReturns: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await purchaseService.listReturns(req.query as PurchaseListQuery));
  }),

  // Stock movements
  stockMovements: asyncHandler(async (req: Request, res: Response) => {
    const { productId, type, page, limit } = req.query as Record<string, string | undefined>;
    return sendSuccess(
      res,
      await purchaseService.listStockMovements({
        productId,
        type,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 15,
      }),
    );
  }),
};
