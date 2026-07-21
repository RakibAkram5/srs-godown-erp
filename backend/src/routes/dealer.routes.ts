import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  createDealerSchema,
  updateDealerSchema,
  dealerStatusSchema,
} from '@/validators/dealer.validator';
import { dealerController } from '@/controllers/dealer.controller';
import { adjustSchema } from '@/validators/adjustment.validator';

const router = Router();
router.use(authenticate);

router.get('/', dealerController.list);
router.post('/', validate(createDealerSchema), dealerController.create);
router.get('/:id', dealerController.get);
router.get('/:id/ledger', adminOnly, dealerController.ledger);
router.post('/:id/adjust', adminOnly, validate(adjustSchema), dealerController.adjust);
router.put('/:id', validate(updateDealerSchema), dealerController.update);
router.patch('/:id/status', validate(dealerStatusSchema), dealerController.setStatus);
router.delete('/:id', dealerController.remove);

export default router;
