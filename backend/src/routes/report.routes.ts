import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { reportController } from '@/controllers/report.controller';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/financial', reportController.financial);
router.get('/pending-ledger', reportController.pendingLedger);

export default router;
