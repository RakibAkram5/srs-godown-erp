import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
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

router.get('/', saleController.list);
router.post('/', validate(createSaleSchema), saleController.create);
router.get('/:id', saleController.get);
router.put('/:id', validate(updateSaleSchema), saleController.update);
router.post('/:id/complete', saleController.complete);
router.delete('/:id', saleController.remove);

export default router;
