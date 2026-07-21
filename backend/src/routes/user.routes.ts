import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, resetPasswordSchema } from '@/validators/user.validator';
import { userController } from '@/controllers/user.controller';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/', userController.list);
router.post('/', validate(createUserSchema), userController.create);
router.put('/:id', validate(updateUserSchema), userController.update);
router.post('/:id/reset-password', validate(resetPasswordSchema), userController.resetPassword);
router.delete('/:id', userController.remove);

export default router;
