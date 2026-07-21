import { Router } from 'express';
import { authenticate, authorizePermission } from '@/middlewares/auth.middleware';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import settingsRoutes from './settings.routes';
import mastersRoutes from './masters.routes';
import productRoutes from './product.routes';
import vendorRoutes from './vendor.routes';
import purchaseRoutes from './purchase.routes';
import saleRoutes from './sale.routes';
import dealerRoutes from './dealer.routes';
import paymentRoutes from './payment.routes';
import dispatchRoutes from './dispatch.routes';
import userRoutes from './user.routes';
import expenseRoutes from './expense.routes';
import salaryRoutes from './salary.routes';
import reportRoutes from './report.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// module permission gate — admin bypasses, others need the module in their permissions
const gate = (mod: string) => [authenticate, authorizePermission(mod)];

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/masters', gate('masters'), mastersRoutes);
router.use('/products', gate('products'), productRoutes);
router.use('/vendors', gate('vendors'), vendorRoutes);
router.use('/purchases', gate('purchases'), purchaseRoutes);
router.use('/sales', gate('sales'), saleRoutes);
router.use('/dealers', gate('dealers'), dealerRoutes);
router.use('/payments', paymentRoutes); // admin-only (enforced inside)
router.use('/dispatches', gate('dispatch'), dispatchRoutes);
router.use('/users', userRoutes); // admin-only (enforced inside)
router.use('/expenses', expenseRoutes); // admin-only
router.use('/salaries', salaryRoutes); // admin-only
router.use('/reports', reportRoutes); // admin-only
router.use('/dashboard', dashboardRoutes);

export default router;
