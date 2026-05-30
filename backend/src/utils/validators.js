import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(10).required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

export const twoFactorVerifySchema = Joi.object({
  twoFactorToken: Joi.string().trim().required(),
  code: Joi.string().trim().min(4).max(12).allow('', null),
  backupCode: Joi.string().trim().min(6).max(32).allow('', null),
}).or('code', 'backupCode');

export const twoFactorConfirmEnableSchema = Joi.object({
  code: Joi.string().trim().min(4).max(12).required(),
});

export const twoFactorDisableSchema = Joi.object({
  password: Joi.string().required(),
  code: Joi.string().trim().allow('', null),
  backupCode: Joi.string().trim().allow('', null),
}).or('code', 'backupCode');

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().trim().lowercase(),
  avatar: Joi.string().allow('', null).max(10000000),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

export const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().trim().lowercase().optional(),
  avatar: Joi.string().allow('', null).max(10000000).optional(),
}).min(1);

export const walletCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
});

export const walletUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
}).min(1);

export const savingsAccountCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  balance: Joi.number().min(0).default(0),
});

export const savingsAccountUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  balance: Joi.number().min(0),
}).min(1);

export const savingsTransferSchema = Joi.object({
  walletId: Joi.number().integer().positive().required(),
  savingsId: Joi.number().integer().positive().required(),
  direction: Joi.string().valid('deposit', 'withdraw').required(),
  amount: Joi.number().positive().required(),
  note: Joi.string().allow('', null).max(500),
  date: Joi.date().iso(),
});

export const transactionCreateSchema = Joi.object({
  walletId: Joi.number().integer().positive().required(),
  categoryId: Joi.number().integer().positive().required(),
  type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().positive().required(),
  note: Joi.string().allow('', null).max(500),
  date: Joi.date().iso(),
});

export const transactionQuerySchema = Joi.object({
  dateFrom: Joi.string().isoDate(),
  dateTo: Joi.string().isoDate(),
  type: Joi.string().valid('income', 'expense'),
  categoryId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ),
  page: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(1),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(100),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(20),
});

export const budgetCreateSchema = Joi.object({
  categoryId: Joi.number().integer().positive().required(),
  walletId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});

export const budgetUpdateSchema = Joi.object({
  categoryId: Joi.number().integer().positive(),
  walletId: Joi.number().integer().positive(),
  amount: Joi.number().positive(),
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000).max(2100),
}).min(1);

export const categoryCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  type: Joi.string().valid('income', 'expense').required(),
});

export const categoryUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  type: Joi.string().valid('income', 'expense').required(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const adminUserUpdateSchema = Joi.object({
  role: Joi.string().valid('user', 'admin'),
  isDeleted: Joi.number().valid(0, 1),
}).min(1);

export const dashboardQuerySchema = Joi.object({
  dateFrom: Joi.string().isoDate(),
  dateTo: Joi.string().isoDate(),
  year: Joi.alternatives().try(
    Joi.number().integer().min(2000).max(2100),
    Joi.string().pattern(/^\d{4}$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 2000 || num > 2100) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ),
});

export const historyQuerySchema = Joi.object({
  mode: Joi.string().valid('all', 'day', 'month', 'year').default('all'),
  activityType: Joi.string()
    .valid('all', 'transaction', 'budget', 'wallet', 'profile', 'category', 'savings', 'admin', 'system', 'goal')
    .default('all'),
  day: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  month: Joi.alternatives().try(
    Joi.number().integer().min(1).max(12),
    Joi.string().pattern(/^\d{1,2}$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 1 || num > 12) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ),
  year: Joi.alternatives().try(
    Joi.number().integer().min(2000).max(2100),
    Joi.string().pattern(/^\d{4}$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 2000 || num > 2100) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ),
  page: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(1),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(200),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(20),
  txPage: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(1),
  txLimit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(100),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(30),
  savingsPage: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(1),
  savingsLimit: Joi.alternatives().try(
    Joi.number().integer().min(1).max(50),
    Joi.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))
  ).default(15),
}).custom((value, helpers) => {
  if (value.mode === 'day' && !value.day) {
    return helpers.message('Mode day requires day');
  }
  if (value.mode === 'month' && (!value.month || !value.year)) {
    return helpers.message('Mode month requires month and year');
  }
  if (value.mode === 'year' && !value.year) {
    return helpers.message('Mode year requires year');
  }
  return value;
});

export const reportQuerySchema = Joi.object({
  year: Joi.alternatives().try(
    Joi.number().integer().min(2000).max(2100),
    Joi.string().pattern(/^\d{4}$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 2000 || num > 2100) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ).required(),
  month: Joi.alternatives().try(
    Joi.number().integer().min(1).max(12),
    Joi.string().pattern(/^\d{1,2}$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 1 || num > 12) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ),
  quarter: Joi.alternatives().try(
    Joi.number().integer().min(1).max(4),
    Joi.string().pattern(/^[1-4]$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 1 || num > 4) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ),
  week: Joi.alternatives().try(
    Joi.number().integer().min(1).max(53),
    Joi.string().pattern(/^\d{1,2}$/).custom((value, helpers) => {
      const num = parseInt(value, 10);
      if (num < 1 || num > 53) {
        return helpers.error('any.invalid');
      }
      return num;
    })
  ),
});

export const reportCompareSchema = Joi.object({
  periodType: Joi.string().valid('month', 'quarter', 'year').required(),
  period1: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required(),
    month: Joi.number().integer().min(1).max(12),
    quarter: Joi.number().integer().min(1).max(4),
  }).required(),
  period2: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required(),
    month: Joi.number().integer().min(1).max(12),
    quarter: Joi.number().integer().min(1).max(4),
  }).required(),
});

export const reportTrendSchema = Joi.object({
  periodType: Joi.string().valid('month', 'quarter', 'year').required(),
  periods: Joi.array().items(
    Joi.object({
      year: Joi.number().integer().min(2000).max(2100).required(),
      month: Joi.number().integer().min(1).max(12),
      quarter: Joi.number().integer().min(1).max(4),
    })
  ).min(2).required(),
});

export const reportSavingsSchema = Joi.object({
  periodType: Joi.string().valid('month', 'quarter', 'year').required(),
  period: Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required(),
    month: Joi.number().integer().min(1).max(12),
    quarter: Joi.number().integer().min(1).max(4),
  }).required(),
});

export const goalCreateSchema = Joi.object({
  walletId: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(1).max(100).required(),
  targetAmount: Joi.number().positive().required(),
  targetDate: Joi.date().iso().required(),
});

export const goalUpdateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  targetAmount: Joi.number().positive(),
  targetDate: Joi.date().iso(),
  walletId: Joi.number().integer().positive(),
  status: Joi.string().valid('active', 'completed', 'overdue'),
}).min(1);

export const goalTransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  note: Joi.string().allow('', null).max(500),
});
