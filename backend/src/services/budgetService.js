import * as budgetRepository from '../repositories/budgetRepository.js';
import * as categoryRepository from '../repositories/categoryRepository.js';
import * as transactionRepository from '../repositories/transactionRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import { getDb } from '../database/db.js';
import { logActivity, ensureMonthlyRollover } from './historyService.js';

function enrichWithSpend(b, userId) {
  const spent = transactionRepository.sumExpenseForBudget(
    userId,
    b.categoryId,
    b.month,
    b.year
  );
  const budgetAmount = b.amount;
  const remaining = budgetAmount - spent;
  const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  const exceeded = spent > budgetAmount;
  const now = new Date();
  const isCurrentMonth =
    Number(b.month) === now.getMonth() + 1 && Number(b.year) === now.getFullYear();
  const daysInBudgetMonth = new Date(Number(b.year), Number(b.month), 0).getDate();
  const daysPassed = isCurrentMonth ? now.getDate() : daysInBudgetMonth;
  const daysRemaining = isCurrentMonth
    ? Math.max(daysInBudgetMonth - now.getDate() + 1, 1)
    : 1;
  const plannedPerDay = budgetAmount > 0 ? Math.floor(budgetAmount / daysInBudgetMonth) : 0;
  const avgSpentPerDay = daysPassed > 0 ? Math.floor(spent / daysPassed) : 0;
  const suggestedPerDayFromNow =
    remaining > 0 && isCurrentMonth ? Math.floor(remaining / daysRemaining) : 0;
  return {
    ...b,
    spent,
    remaining,
    percentUsed: Math.round(percentUsed * 100) / 100,
    exceeded,
    warning: exceeded ? 'Vượt ngân sách cho danh mục này' : null,
    dailyPlan: {
      plannedPerDay,
      avgSpentPerDay,
      suggestedPerDayFromNow,
      daysRemaining,
    },
  };
}

export function list(userId) {
  // Chốt tháng cũ trước khi liệt kê: ghi log activity về việc chốt ngân sách
  // Mô hình hiện đại: không hoàn tiền về ví, chỉ ghi log
  ensureMonthlyRollover(userId);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const rows = budgetRepository.listByUser(userId).filter(
    (b) =>
      Number(b.month) === currentMonth && Number(b.year) === currentYear
  );
  return rows.map((b) => enrichWithSpend(b, userId));
}

export function create(userId, data) {
  const cat = categoryRepository.findById(data.categoryId);
  if (!cat || cat.type !== 'expense') {
    const err = new Error('Budget requires an expense category');
    err.status = 400;
    throw err;
  }
  const wallet = walletRepository.findByIdForUser(data.walletId, userId);
  if (!wallet) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  // Mô hình hiện đại: không trừ tiền từ ví khi tạo ngân sách
  try {
    const db = getDb();
    const run = db.transaction(() => {
      return budgetRepository.create({ userId, ...data });
    });
    const b = run();
    logActivity({
      userId,
      actionType: 'create',
      entityType: 'budget',
      entityId: b.id,
      title: `Tạo ngân sách ${b.categoryName}`,
      details: `Tháng ${b.month}/${b.year}`,
      amount: b.amount,
    });
    return enrichWithSpend(b, userId);
  } catch (e) {
    if (isUniqueConstraint(e)) {
      const err = new Error('Budget already exists for this category and month');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

function isUniqueConstraint(e) {
  if (!e) return false;
  if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return true;
  return String(e.message || '').includes('UNIQUE');
}

export function update(userId, id, data) {
  const existing = budgetRepository.findById(id, userId);
  if (!existing) {
    const err = new Error('Budget not found');
    err.status = 404;
    throw err;
  }
  if (data.categoryId) {
    const cat = categoryRepository.findById(data.categoryId);
    if (!cat || cat.type !== 'expense') {
      const err = new Error('Budget requires an expense category');
      err.status = 400;
      throw err;
    }
  }
  const nextWalletId = data.walletId !== undefined ? Number(data.walletId) : Number(existing.walletId);
  const nextAmount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount);
  const nextCategoryId = data.categoryId !== undefined ? Number(data.categoryId) : Number(existing.categoryId);
  const nextMonth = data.month !== undefined ? Number(data.month) : Number(existing.month);
  const nextYear = data.year !== undefined ? Number(data.year) : Number(existing.year);
  const currentWalletId = Number(existing.walletId);
  const currentAmount = Number(existing.amount);

  if (nextWalletId !== currentWalletId || nextAmount !== currentAmount) {
    const nextWallet = walletRepository.findByIdForUser(nextWalletId, userId);
    if (!nextWallet) {
      const err = new Error('Wallet not found');
      err.status = 404;
      throw err;
    }
    // Mô hình hiện đại: không kiểm tra số dư ví khi cập nhật ngân sách
    // Cho phép giảm ngân sách dù đã chi vượt (budget chỉ là kế hoạch)
  }
  try {
    const db = getDb();
    const run = db.transaction(() => {
      // Mô hình hiện đại: không điều chỉnh ví khi cập nhật ngân sách
      return budgetRepository.update(id, userId, data);
    });
    const b = run();
    logActivity({
      userId,
      actionType: 'update',
      entityType: 'budget',
      entityId: b.id,
      title: `Sửa ngân sách ${b.categoryName}`,
      details: `Tháng ${b.month}/${b.year}`,
      amount: b.amount,
    });
    return enrichWithSpend(b, userId);
  } catch (e) {
    if (isUniqueConstraint(e)) {
      const err = new Error('Budget already exists for this category and month');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

export function remove(userId, id) {
  const existing = budgetRepository.findById(id, userId);
  if (!existing) {
    const err = new Error('Budget not found');
    err.status = 404;
    throw err;
  }
  const db = getDb();
  const spent = transactionRepository.sumExpenseForBudget(
    userId,
    existing.categoryId,
    existing.month,
    existing.year
  );
  const refundable = Math.max(
    Math.round((Number(existing.amount) - Number(spent) + Number.EPSILON) * 100) / 100,
    0
  );

  const wallet = existing.walletId
    ? walletRepository.findByIdForUser(existing.walletId, userId)
    : null;
  const walletName = existing.walletName || wallet?.name || 'Không xác định';

  // Mô hình hiện đại: không hoàn tiền về ví khi xóa ngân sách
  const run = db.transaction(() => {
    budgetRepository.remove(id, userId);
  });
  run();

  logActivity({
    userId,
    actionType: 'delete',
    entityType: 'budget',
    entityId: id,
    title: `Xóa ngân sách ${existing.categoryName}`,
    details: `Tháng ${existing.month}/${existing.year}`,
    amount: existing.amount,
  });

  return {
    id,
    refundedAmount: 0,
    walletId: existing.walletId,
    walletName,
    categoryName: existing.categoryName,
    month: existing.month,
    year: existing.year,
  };
}

export function detail(userId, id) {
  const budget = budgetRepository.findById(id, userId);
  if (!budget) {
    const err = new Error('Budget not found');
    err.status = 404;
    throw err;
  }
  const enriched = enrichWithSpend(budget, userId);
  const transactions = transactionRepository.listExpensesForBudget(
    userId,
    budget.categoryId,
    budget.month,
    budget.year
  );
  return {
    budget: enriched,
    transactions,
  };
}
