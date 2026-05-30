import { getDb } from '../database/db.js';
import * as transactionRepository from '../repositories/transactionRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import * as categoryRepository from '../repositories/categoryRepository.js';
import * as budgetRepository from '../repositories/budgetRepository.js';
import { toSqlDate } from '../utils/date.js';
import { logActivity } from './historyService.js';

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

  const db = getDb();
  const run = db.transaction(() => {
    const txDate = date ? new Date(date) : new Date();
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();

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

  const db = getDb();
  const run = db.transaction(() => {
    const txDate = date ? new Date(date) : new Date();
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();

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
  return updated;
}
