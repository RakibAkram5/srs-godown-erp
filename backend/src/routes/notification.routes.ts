import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { notificationController } from '@/controllers/notification.controller';

const router = Router();
router.use(authenticate);
router.get('/', notificationController.list);

export default router;
