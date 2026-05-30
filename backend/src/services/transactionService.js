import { getDb } from '../database/db.js';
import * as transactionRepository from '../repositories/transactionRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import * as categoryRepository from '../repositories/categoryRepository.js';
import * as budgetRepository from '../repositories/budgetRepository.js';
import { toSqlDate } from '../utils/date.js';
import { logActivity } from './historyService.js';
import * as notificationService from './notificationService.js';

export function createTransaction(userId, body) {
  const { walletId, categoryId, type, amount, note, date } = body;
  const wallet = walletRepository.findByIdForUser(walletId, userId);
  if (!wallet) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  const category = categoryRepository.findById(categoryId, userId);
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  if (category.type !== type) {
    const err = new Error('Category type does not match transaction type');
    err.status = 400;
    throw err;
  }

  const txDate = date ? new Date(date) : new Date();
  const txMonth = txDate.getMonth() + 1;
  const txYear = txDate.getFullYear();

  const db = getDb();
  const run = db.transaction(() => {
    if (type === 'expense') {
      // Phải có ngân sách cho danh mục thì mới cho phép thêm giao dịch chi tiêu
      const budget = budgetRepository.findByUserCategoryMonthYear(
        userId,
        categoryId,
        txMonth,
        txYear
      );
      if (!budget || Number(budget.amount) <= 0) {
        const err = new Error('Danh mục này chưa thiết lập ngân sách. Vui lòng thiết lập ngân sách trước khi thêm giao dịch.');
        err.status = 400;
        throw err;
      }
      // Trừ tiền từ ví khi chi tiêu
      walletRepository.adjustBalance(walletId, -amount);
    } else {
      walletRepository.adjustBalance(walletId, amount);
    }
    return transactionRepository.insert({
      userId,
      walletId,
      categoryId,
      type,
      amount,
      note,
      date,
    });
  });

  const created = run();
  logActivity({
    userId,
    actionType: 'create',
    entityType: 'transaction',
    entityId: created.id,
    title: type === 'income' ? 'Ghi nhận thu nhập' : 'Ghi nhận chi tiêu',
    details: `Danh mục: ${category.name} | Ví: ${wallet.name}`,
    amount,
    occurredAt: created.date,
  });

  // Check budget status and create notifications for expenses
  if (type === 'expense') {
    checkBudgetNotifications(userId, categoryId, txMonth, txYear, category.name);
  }

  return created;
}

export function listTransactions(userId, query) {
  const {
    dateFrom,
    dateTo,
    type,
    categoryId,
    page = 1,
    limit = 20,
  } = query;
  return transactionRepository.listForUser(
    userId,
    {
      dateFrom: toSqlDate(dateFrom),
      dateTo: toSqlDate(dateTo),
      type,
      categoryId,
    },
    { page, limit }
  );
}

export function updateTransaction(userId, transactionId, body) {
  const { walletId, categoryId, type, amount, note, date } = body;
  
  const existing = transactionRepository.findById(transactionId, userId);
  if (!existing) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  
  const wallet = walletRepository.findByIdForUser(walletId, userId);
  if (!wallet) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  const category = categoryRepository.findById(categoryId, userId);
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  if (category.type !== type) {
    const err = new Error('Category type does not match transaction type');
    err.status = 400;
    throw err;
  }

  const txDate = date ? new Date(date) : new Date();
  const txMonth = txDate.getMonth() + 1;
  const txYear = txDate.getFullYear();

  const db = getDb();
  const run = db.transaction(() => {
    if (type === 'expense') {
      const budget = budgetRepository.findByUserCategoryMonthYear(
        userId,
        categoryId,
        txMonth,
        txYear
      );
      if (!budget || Number(budget.amount) <= 0) {
        const err = new Error('Danh mục này chưa thiết lập ngân sách. Vui lòng thiết lập ngân sách trước khi cập nhật giao dịch.');
        err.status = 400;
        throw err;
      }
    }

    // Hoàn tác thay đổi balance cũ
    if (existing.type === 'expense') {
      walletRepository.adjustBalance(existing.walletId, Number(existing.amount));
    } else {
      walletRepository.adjustBalance(existing.walletId, -Number(existing.amount));
    }

    // Áp dụng thay đổi balance mới
    if (type === 'expense') {
      walletRepository.adjustBalance(walletId, -amount);
    } else {
      walletRepository.adjustBalance(walletId, amount);
    }

    return transactionRepository.update(transactionId, {
      walletId,
      categoryId,
      type,
      amount,
      note,
      date,
    });
  });

  const updated = run();
  logActivity({
    userId,
    actionType: 'update',
    entityType: 'transaction',
    entityId: updated.id,
    title: type === 'income' ? 'Cập nhật thu nhập' : 'Cập nhật chi tiêu',
    details: `Danh mục: ${category.name} | Ví: ${wallet.name}`,
    amount,
    occurredAt: updated.date,
  });

  // Check budget status and create notifications for expenses
  if (type === 'expense') {
    checkBudgetNotifications(userId, categoryId, txMonth, txYear, category.name);
  }

  return updated;
}

export function deleteTransaction(userId, transactionId) {
  const existing = transactionRepository.findById(transactionId, userId);
  if (!existing) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }

  const db = getDb();
  const run = db.transaction(() => {
    // Hoàn tác balance
    if (existing.type === 'expense') {
      walletRepository.adjustBalance(existing.walletId, Number(existing.amount));
    } else {
      walletRepository.adjustBalance(existing.walletId, -Number(existing.amount));
    }

    const deleted = transactionRepository.deleteTransaction(transactionId, userId);
    if (!deleted) {
      const err = new Error('Failed to delete transaction');
      err.status = 500;
      throw err;
    }

    return deleted;
  });

  run();

  logActivity({
    userId,
    actionType: 'delete',
    entityType: 'transaction',
    entityId: transactionId,
    title: existing.type === 'income' ? 'Xóa thu nhập' : 'Xóa chi tiêu',
    details: `Danh mục: ${existing.categoryName} | Ví: ${existing.walletName}`,
    amount: existing.amount,
    occurredAt: existing.date,
  });

  // Check budget status after deletion (for expenses)
  if (existing.type === 'expense') {
    const txDate = existing.date ? new Date(existing.date) : new Date();
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();
    checkBudgetNotifications(userId, existing.categoryId, txMonth, txYear, existing.categoryName);
  }

  return { success: true };
}

function checkBudgetNotifications(userId, categoryId, month, year, categoryName) {
  const budget = budgetRepository.findByUserCategoryMonthYear(userId, categoryId, month, year);
  if (!budget) return;

  const spent = transactionRepository.sumExpenseForBudget(userId, categoryId, month, year);
  const budgetAmount = Number(budget.amount);
  const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  const exceeded = spent > budgetAmount;
  const percentExceeded = exceeded ? percentUsed - 100 : 0;

  // Check if we should create notifications (avoid duplicates by checking recent notifications)
  const db = getDb();
  const recentNotification = db.prepare(`
    SELECT * FROM notifications 
    WHERE userId = ? AND type IN ('budget_warning', 'budget_exceeded') 
    AND message LIKE ?
    ORDER BY createdAt DESC LIMIT 1
  `).get(userId, `%${categoryName}%`);

  const now = new Date();
  const notificationTime = recentNotification ? new Date(recentNotification.createdAt) : null;
  const hoursSinceLastNotification = notificationTime ? (now - notificationTime) / (1000 * 60 * 60) : 999;

  // Only create notification if it's been more than 24 hours since the last similar notification
  if (hoursSinceLastNotification < 24) return;

  if (exceeded) {
    const exceededAmount = spent - budgetAmount;
    notificationService.createNotification({
      userId,
      type: 'budget_exceeded',
      title: 'Vượt ngân sách',
      message: `Bạn đã vượt ngân sách ${categoryName} ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(exceededAmount)} (đã sử dụng ${Math.round(percentUsed)}%).`,
    });
  } else if (percentUsed >= 80) {
    // Determine milestone reached
    let milestone = 80;
    if (percentUsed >= 95) milestone = 95;
    else if (percentUsed >= 90) milestone = 90;
    else if (percentUsed >= 85) milestone = 85;
    
    notificationService.createNotification({
      userId,
      type: 'budget_warning',
      title: 'Cảnh báo ngân sách',
      message: `Ngân sách ${categoryName} đã chạm mốc ${milestone}% (đã sử dụng ${Math.round(percentUsed)}%).`,
    });
  }
}
