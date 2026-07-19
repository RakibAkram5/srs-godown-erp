import { Router } from 'express';
import { settingsController } from '@/controllers/settings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { updateSettingsSchema } from '@/validators/settings.validator';

const router = Router();

router.get('/', authenticate, settingsController.get);
router.put('/', authenticate, validate(updateSettingsSchema), settingsController.update);

export default router;
