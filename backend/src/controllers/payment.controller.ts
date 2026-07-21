import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { paymentService, PaymentListQuery } from '@/services/payment.service';

export const paymentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await paymentService.list(req.query as PaymentListQuery));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const label = req.body.type === 'DEALER_RECEIPT' ? 'Receipt recorded' : 'Payment recorded';
    return sendSuccess(res, await paymentService.create(req.body), label, 201);
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await paymentService.remove(req.params.id);
    return sendSuccess(res, null, 'Entry deleted');
  }),
};
