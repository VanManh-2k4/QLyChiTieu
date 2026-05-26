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
  const category = categoryRepository.findById(categoryId);
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
      // Mô hình hiện đại: không bắt buộc phải có ngân sách
      // Budget chỉ là kế hoạch chi tiêu để theo dõi
      const budget = budgetRepository.findByUserCategoryMonthYear(
        userId,
        categoryId,
        txMonth,
        txYear
      );
      // Trừ tiền từ ví khi chi tiêu (modern financial model)
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
