import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createPaymentSchema, updatePaymentSchema } from '@/validators/payment.validator';
import { paymentController } from '@/controllers/payment.controller';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/', paymentController.list);
router.post('/', validate(createPaymentSchema), paymentController.create);
router.put('/:id', validate(updatePaymentSchema), paymentController.update);
router.delete('/:id', paymentController.remove);

export default router;
