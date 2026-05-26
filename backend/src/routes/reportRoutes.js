import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateQuery, validateBody } from '../middlewares/validateMiddleware.js';
import {
  reportQuerySchema,
  reportCompareSchema,
  reportTrendSchema,
  reportSavingsSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);

router.get('/weekly', validateQuery(reportQuerySchema), reportController.weeklyReport);
router.get('/monthly', validateQuery(reportQuerySchema), reportController.monthlyReport);
router.get('/quarterly', validateQuery(reportQuerySchema), reportController.quarterlyReport);
router.get('/yearly', validateQuery(reportQuerySchema), reportController.yearlyReport);
router.post('/compare', validateBody(reportCompareSchema), reportController.comparePeriods);
router.post('/trends', validateBody(reportTrendSchema), reportController.analyzeTrends);
router.post('/savings', validateBody(reportSavingsSchema), reportController.suggestSavings);
router.get('/budget-compare', validateQuery(reportQuerySchema), reportController.compareWithBudget);
router.get('/monthly-summary', validateQuery(reportQuerySchema), reportController.getMonthlySummary);
router.get('/spending-patterns', validateQuery(reportQuerySchema), reportController.analyzeSpendingPatterns);
router.get('/goals', validateQuery(reportQuerySchema), reportController.trackGoals);
router.get('/anomalies', validateQuery(reportQuerySchema), reportController.detectAnomalies);
router.get('/goal-analysis', reportController.getGoalAnalysis);

export default router;
