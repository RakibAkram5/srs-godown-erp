import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { authRateLimiter } from '@/middlewares/rateLimiter';
import { loginSchema, registerSchema } from '@/validators/auth.validator';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.get('/me', authenticate, authController.me);

export default router;
