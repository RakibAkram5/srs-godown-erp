import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import settingsRoutes from './settings.routes';
import mastersRoutes from './masters.routes';
import productRoutes from './product.routes';
import vendorRoutes from './vendor.routes';
import purchaseRoutes from './purchase.routes';
import saleRoutes from './sale.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/masters', mastersRoutes);
router.use('/products', productRoutes);
router.use('/vendors', vendorRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales', saleRoutes);

export default router;
