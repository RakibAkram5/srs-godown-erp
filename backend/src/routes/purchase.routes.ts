import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  createReturnSchema,
} from '@/validators/purchase.validator';
import { purchaseController } from '@/controllers/purchase.controller';

const router = Router();
router.use(authenticate);

// Stock movement history + returns (specific routes before /:id)
router.get('/stock-movements', purchaseController.stockMovements);
router.get('/returns', purchaseController.listReturns);
router.post('/returns', validate(createReturnSchema), purchaseController.createReturn);

router.get('/', purchaseController.list);
router.post('/', validate(createPurchaseSchema), purchaseController.create);
router.get('/:id', purchaseController.get);
router.put('/:id', validate(updatePurchaseSchema), purchaseController.update);
router.post('/:id/complete', purchaseController.complete);
router.delete('/:id', purchaseController.remove);

export default router;
