import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorVerifySchema,
  twoFactorConfirmEnableSchema,
  twoFactorDisableSchema,
} from '../utils/validators.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);

router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/2fa/login-verify',
  authLimiter,
  validateBody(twoFactorVerifySchema),
  authController.twoFactorLoginVerify
);

router.post('/2fa/setup', authMiddleware, authController.twoFactorSetup);
router.post(
  '/2fa/enable',
  authMiddleware,
  validateBody(twoFactorConfirmEnableSchema),
  authController.twoFactorEnable
);
router.post(
  '/2fa/disable',
  authMiddleware,
  validateBody(twoFactorDisableSchema),
  authController.twoFactorDisable
);

export default router;
