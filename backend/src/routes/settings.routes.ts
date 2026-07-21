import { Router } from 'express';
import { settingsController } from '@/controllers/settings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { updateSettingsSchema } from '@/validators/settings.validator';

const router = Router();

// Public branding (no auth) — used by the login page.
router.get('/branding', settingsController.branding);

router.get('/', authenticate, settingsController.get);
router.put('/', authenticate, adminOnly, validate(updateSettingsSchema), settingsController.update);

export default router;
