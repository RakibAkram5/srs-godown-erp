import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorStatusSchema,
} from '@/validators/vendor.validator';
import { vendorController } from '@/controllers/vendor.controller';

const router = Router();
router.use(authenticate);

router.get('/', vendorController.list);
router.post('/', validate(createVendorSchema), vendorController.create);
router.get('/:id', vendorController.get);
router.get('/:id/history', vendorController.history);
router.put('/:id', validate(updateVendorSchema), vendorController.update);
router.patch('/:id/status', validate(vendorStatusSchema), vendorController.setStatus);
router.delete('/:id', vendorController.remove);

export default router;
