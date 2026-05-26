import { Router } from 'express';
import * as walletController from '../controllers/walletController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateBody, validateParams } from '../middlewares/validateMiddleware.js';
import {
  idParamSchema,
  walletCreateSchema,
  walletUpdateSchema,
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);
router.get('/', walletController.list);
router.post('/', validateBody(walletCreateSchema), walletController.create);
router.put('/:id', validateParams(idParamSchema), validateBody(walletUpdateSchema), walletController.update);
router.delete('/:id', validateParams(idParamSchema), walletController.remove);

export default router;
