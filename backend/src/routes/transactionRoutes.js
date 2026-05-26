import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware.js';
import {
  transactionCreateSchema,
  transactionQuerySchema,
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.post(
  '/',
  validateBody(transactionCreateSchema),
  transactionController.create
);
router.get(
  '/',
  validateQuery(transactionQuerySchema),
  transactionController.list
);

export default router;
