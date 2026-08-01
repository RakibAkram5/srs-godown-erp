import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  createSaleSchema,
  updateSaleSchema,
  createSaleReturnSchema,
} from '@/validators/sale.validator';
import { saleController } from '@/controllers/sale.controller';

const router = Router();
router.use(authenticate);

router.get('/returns', saleController.listReturns);
router.post('/returns', validate(createSaleReturnSchema), saleController.createReturn);
router.get('/pending', adminOnly, saleController.listPending);
router.post('/items/:itemId/fulfill', adminOnly, saleController.fulfillItem);

router.get('/', saleController.list);
// Creating a new invoice is admin-only; editing/deleting existing ones stays
// available to anyone with the sales permission (unchanged from before).
router.post('/', adminOnly, validate(createSaleSchema), saleController.create);
router.get('/:id', saleController.get);
router.put('/:id', validate(updateSaleSchema), saleController.update);
router.post('/:id/complete', saleController.complete);
router.delete('/:id', saleController.remove);

export default router;
