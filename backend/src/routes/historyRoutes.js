import { Router } from 'express';
import * as historyController from '../controllers/historyController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateQuery } from '../middlewares/validateMiddleware.js';
import { historyQuerySchema } from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.get('/', validateQuery(historyQuerySchema), historyController.list);

export default router;
