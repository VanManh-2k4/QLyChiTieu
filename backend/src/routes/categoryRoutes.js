import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  validateBody,
  validateParams,
} from '../middlewares/validateMiddleware.js';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  idParamSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.get('/', categoryController.list);
router.post('/', validateBody(categoryCreateSchema), categoryController.create);
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(categoryUpdateSchema),
  categoryController.update
);
router.delete('/:id', validateParams(idParamSchema), categoryController.remove);

export default router;
