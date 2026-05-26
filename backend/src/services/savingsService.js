import { getDb } from '../database/db.js';
import * as walletRepository from '../repositories/walletRepository.js';
import * as savingsRepository from '../repositories/savingsRepository.js';
import { logActivity } from './historyService.js';

export function listAccounts(userId) {
  return savingsRepository.listAccounts(userId);
}

export function createAccount(userId, data) {
  const created = savingsRepository.createAccount({ userId, ...data });
  logActivity({
    userId,
    actionType: 'create',
    entityType: 'savings_account',
    entityId: created.id,
    title: `Tạo quỹ tiết kiệm ${created.name}`,
    amount: created.balance,
  });
  return created;
}

export function updateAccount(userId, id, data) {
  const existing = savingsRepository.findAccountForUser(id, userId);
  if (!existing) {
    const err = new Error('Savings account not found');
    err.status = 404;
    throw err;
  }
  const updated = savingsRepository.updateAccount(id, userId, data);
  logActivity({
    userId,
    actionType: 'update',
    entityType: 'savings_account',
    entityId: updated.id,
    title: `Sửa quỹ tiết kiệm ${updated.name}`,
    amount: updated.balance,
  });
  return updated;
}

export function removeAccount(userId, id) {
  const existing = savingsRepository.findAccountForUser(id, userId);
  if (!existing) {
    const err = new Error('Savings account not found');
    err.status = 404;
    throw err;
  }
  savingsRepository.softDeleteAccount(id, userId);
  logActivity({
    userId,
    actionType: 'delete',
    entityType: 'savings_account',
    entityId: id,
    title: `Xóa quỹ tiết kiệm ${existing.name}`,
  });
}

export function createTransfer(userId, body) {
  const { walletId, savingsId, direction, amount, note, date } = body;
  const wallet = walletRepository.findByIdForUser(walletId, userId);
  if (!wallet) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  const savings = savingsRepository.findAccountForUser(savingsId, userId);
  if (!savings) {
    const err = new Error('Savings account not found');
    err.status = 404;
    throw err;
  }

  const db = getDb();
  const run = db.transaction(() => {
    if (direction === 'deposit') {
      if (wallet.balance < amount) {
        const err = new Error('Insufficient balance in wallet');
        err.status = 400;
        throw err;
      }
      walletRepository.adjustBalance(walletId, -amount);
      savingsRepository.adjustSavingsBalance(savingsId, amount);
    } else {
      if (savings.balance < amount) {
        const err = new Error('Insufficient balance in savings account');
        err.status = 400;
        throw err;
      }
      savingsRepository.adjustSavingsBalance(savingsId, -amount);
      walletRepository.adjustBalance(walletId, amount);
    }
    return savingsRepository.insertTransfer({
      userId,
      walletId,
      savingsId,
      direction,
      amount,
      note,
      date,
    });
  });

  const created = run();
  logActivity({
    userId,
    actionType: 'create',
    entityType: 'savings_transfer',
    entityId: created.id,
    title:
      direction === 'deposit'
        ? 'Chuyển ví sang quỹ tiết kiệm'
        : 'Rút từ quỹ tiết kiệm về ví',
    details: `Ví: ${wallet.name} | Quỹ: ${savings.name}`,
    amount,
    occurredAt: created.date,
  });
  return created;
}

export function listTransfers(userId, query) {
  return savingsRepository.listTransfers(userId, query);
}

