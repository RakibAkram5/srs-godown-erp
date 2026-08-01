import { Request, Response } from 'express';
import { AuditAction } from '@prisma/client';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { logAudit } from '@/utils/audit';
import { paymentService, PaymentListQuery } from '@/services/payment.service';

export const paymentController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    return sendSuccess(res, await paymentService.list(req.query as PaymentListQuery));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const label = req.body.type === 'DEALER_RECEIPT' ? 'Receipt recorded' : 'Payment recorded';
    const payment = await paymentService.create(req.body);
    logAudit(req, AuditAction.PAYMENT_CREATE, `${label}: ${payment.voucherNo ?? payment.id} for ${payment.amount}`);
    return sendSuccess(res, payment, label, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.update(req.params.id, req.body);
    logAudit(req, AuditAction.PAYMENT_UPDATE, `Updated payment ${payment.voucherNo ?? payment.id}`);
    return sendSuccess(res, payment, 'Payment updated');
  }),
  remove: asyncHandler(async (req: Request, res: Response) => {
    await paymentService.remove(req.params.id);
    logAudit(req, AuditAction.PAYMENT_DELETE, `Deleted payment ${req.params.id}`);
    return sendSuccess(res, null, 'Entry deleted');
  }),
};
