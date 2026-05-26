import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateQuery } from '../middlewares/validateMiddleware.js';
import { dashboardQuerySchema } from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.get(
  '/summary',
  validateQuery(dashboardQuerySchema),
  dashboardController.summary
);
router.get(
  '/chart-category',
  validateQuery(dashboardQuerySchema),
  dashboardController.chartCategory
);
router.get(
  '/monthly',
  validateQuery(dashboardQuerySchema),
  dashboardController.monthly
);
router.get('/budget-insights', dashboardController.budgetInsights);

export default router;
