import { Router } from 'express';
import * as savingsController from '../controllers/savingsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validateMiddleware.js';
import {
  idParamSchema,
  savingsAccountCreateSchema,
  savingsAccountUpdateSchema,
  savingsTransferSchema,
  transactionQuerySchema,
} from '../utils/validators.js';

const router = Router();
router.use(authMiddleware);

router.get('/accounts', savingsController.listAccounts);
router.post(
  '/accounts',
  validateBody(savingsAccountCreateSchema),
  savingsController.createAccount
);
router.put(
  '/accounts/:id',
  validateParams(idParamSchema),
  validateBody(savingsAccountUpdateSchema),
  savingsController.updateAccount
);
router.delete('/accounts/:id', validateParams(idParamSchema), savingsController.removeAccount);

router.post('/transfers', validateBody(savingsTransferSchema), savingsController.createTransfer);
router.get('/transfers', validateQuery(transactionQuerySchema), savingsController.listTransfers);

export default router;

