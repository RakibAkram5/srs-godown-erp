import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createDispatchSchema } from '@/validators/dispatch.validator';
import { dispatchController } from '@/controllers/dispatch.controller';

const router = Router();
router.use(authenticate);

router.get('/', dispatchController.list);
router.post('/', validate(createDispatchSchema), dispatchController.create);
router.delete('/:id', dispatchController.remove);

export default router;
