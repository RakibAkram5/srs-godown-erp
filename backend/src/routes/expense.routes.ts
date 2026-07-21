import { Router } from 'express';
import { authenticate, adminOnly } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createExpenseSchema, updateExpenseSchema } from '@/validators/expense.validator';
import { expenseController } from '@/controllers/expense.controller';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/', expenseController.list);
router.post('/', validate(createExpenseSchema), expenseController.create);
router.put('/:id', validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;
