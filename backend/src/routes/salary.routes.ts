import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createSalarySchema, updateSalarySchema } from '@/validators/salary.validator';
import { salaryController } from '@/controllers/salary.controller';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/', salaryController.list);
router.post('/', validate(createSalarySchema), salaryController.create);
router.put('/:id', validate(updateSalarySchema), salaryController.update);
router.delete('/:id', salaryController.remove);

export default router;
