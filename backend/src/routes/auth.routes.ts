import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { authRateLimiter } from '@/middlewares/rateLimiter';
import {
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '@/validators/auth.validator';

const router = Router();

// ── Public ────────────────────────────────────────────
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, validate(refreshSchema), authController.refresh);

// ── Authenticated ─────────────────────────────────────
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
router.get('/login-history', authenticate, authController.loginHistory);
router.get('/audit-log', authenticate, authController.auditLog);

export default router;
