import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware.js';
import {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  depositFunds,
  withdrawFunds,
  getTransactions,
  getDashboard,
} from '../controllers/goalController.js';
import {
  goalCreateSchema,
  goalUpdateSchema,
  goalTransactionSchema,
} from '../utils/validators.js';

const router = express.Router();

router.use(authMiddleware);

// Dashboard
router.get('/dashboard', getDashboard);

// CRUD operations
router.get('/', listGoals);
router.get('/:id', getGoal);
router.post('/', validateBody(goalCreateSchema), createGoal);
router.put('/:id', validateBody(goalUpdateSchema), updateGoal);
router.delete('/:id', deleteGoal);

// Fund management
router.post('/:id/deposit', validateBody(goalTransactionSchema), depositFunds);
router.post('/:id/withdraw', validateBody(goalTransactionSchema), withdrawFunds);

// Transactions
router.get('/:id/transactions', getTransactions);

export default router;
