import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { saleService, SaleListQuery } from '@/services/sale.service';

export const saleController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.list(req.query as SaleListQuery));
  }),
  get: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.get(req.params.id));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.create(req.body), 'Sale saved', 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.update(req.params.id, req.body), 'Sale updated');
  }),
  complete: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.complete(req.params.id), 'Sale completed — stock updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await saleService.remove(req.params.id);
    return sendSuccess(res, null, 'Sale deleted');
  }),
  createReturn: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.createReturn(req.body), 'Return recorded — stock updated', 201);
  }),
  listReturns: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await saleService.listReturns(req.query as SaleListQuery));
  }),
  listPending: asyncHandler(async (_req: Request, res: Response) => {
    return sendSuccess(res, await saleService.listPending());
  }),
  fulfillItem: asyncHandler(async (req: Request, res: Response) => {
    const qty = req.body?.quantity ? Number(req.body.quantity) : undefined;
    return sendSuccess(res, await saleService.fulfillItem(req.params.itemId, qty), 'Item fulfilled — stock updated');
  }),
};
