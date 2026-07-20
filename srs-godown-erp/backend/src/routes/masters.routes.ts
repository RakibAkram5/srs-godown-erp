import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { masterSchema, unitSchema, statusSchema } from '@/validators/master.validator';
import { categoryController, brandController, unitController } from '@/controllers/masters.controller';

const router = Router();

// Everything under /masters requires authentication.
router.use(authenticate);

// ── Categories ────────────────────────────────────────
router.get('/categories', categoryController.list);
router.post('/categories', validate(masterSchema), categoryController.create);
router.put('/categories/:id', validate(masterSchema), categoryController.update);
router.patch('/categories/:id/status', validate(statusSchema), categoryController.setStatus);
router.delete('/categories/:id', categoryController.remove);

// ── Brands ────────────────────────────────────────────
router.get('/brands', brandController.list);
router.post('/brands', validate(masterSchema), brandController.create);
router.put('/brands/:id', validate(masterSchema), brandController.update);
router.patch('/brands/:id/status', validate(statusSchema), brandController.setStatus);
router.delete('/brands/:id', brandController.remove);

// ── Units ─────────────────────────────────────────────
router.get('/units', unitController.list);
router.post('/units', validate(unitSchema), unitController.create);
router.put('/units/:id', validate(unitSchema), unitController.update);
router.patch('/units/:id/status', validate(statusSchema), unitController.setStatus);
router.delete('/units/:id', unitController.remove);

export default router;
