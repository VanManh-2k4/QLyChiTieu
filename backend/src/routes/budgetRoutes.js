import { Router } from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validateMiddleware.js';
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.get('/', budgetController.list);
router.get('/:id/details', validateParams(idParamSchema), budgetController.detail);
router.post('/', validateBody(budgetCreateSchema), budgetController.create);
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(budgetUpdateSchema),
  budgetController.update
);
router.delete('/:id', validateParams(idParamSchema), budgetController.remove);

export default router;
