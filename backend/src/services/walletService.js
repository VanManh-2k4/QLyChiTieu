import * as walletRepository from '../repositories/walletRepository.js';
import { logActivity } from './historyService.js';

export function list(userId) {
  return walletRepository.listByUser(userId);
}

export function create(userId, data) {
  // Wallets always start from 0; balance changes only via income/expense/savings flows.
  const created = walletRepository.create({ userId, name: data.name, balance: 0 });
  logActivity({
    userId,
    actionType: 'create',
    entityType: 'wallet',
    entityId: created.id,
    title: `Tạo ví ${created.name}`,
  });
  return created;
}

export function update(userId, walletId, data) {
  const w = walletRepository.findByIdForUser(walletId, userId);
  if (!w) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  const updated = walletRepository.update(walletId, userId, { name: data.name });
  logActivity({
    userId,
    actionType: 'update',
    entityType: 'wallet',
    entityId: updated.id,
    title: `Sửa ví ${updated.name}`,
  });
  return updated;
}

export function remove(userId, walletId) {
  const w = walletRepository.findByIdForUser(walletId, userId);
  if (!w) {
    const err = new Error('Wallet not found');
    err.status = 404;
    throw err;
  }
  walletRepository.softDelete(walletId, userId);
  logActivity({
    userId,
    actionType: 'delete',
    entityType: 'wallet',
    entityId: walletId,
    title: `Xóa ví ${w.name}`,
  });
}
