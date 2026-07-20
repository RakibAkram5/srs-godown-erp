import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productStatusSchema,
  importProductsSchema,
} from '@/validators/product.validator';
import { productController } from '@/controllers/product.controller';

const router = Router();

router.use(authenticate);

router.get('/', productController.list);
router.post('/', validate(createProductSchema), productController.create);
router.post('/import', validate(importProductsSchema), productController.importMany);
router.get('/:id', productController.get);
router.put('/:id', validate(updateProductSchema), productController.update);
router.patch('/:id/status', validate(productStatusSchema), productController.setStatus);
router.post('/:id/duplicate', productController.duplicate);
router.delete('/:id', productController.remove);

export default router;
