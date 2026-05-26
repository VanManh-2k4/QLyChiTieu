import { getDb } from '../database/db.js';

export function findByIdForUser(walletId, userId) {
  const db = getDb();
  return db
    .prepare(
      'SELECT * FROM wallets WHERE id = ? AND userId = ? AND isDeleted = 0'
    )
    .get(walletId, userId);
}

export function findById(walletId) {
  return getDb()
    .prepare('SELECT * FROM wallets WHERE id = ? AND isDeleted = 0')
    .get(walletId);
}

export function listByUser(userId) {
  return getDb()
    .prepare(
      'SELECT * FROM wallets WHERE userId = ? AND isDeleted = 0 ORDER BY id DESC'
    )
    .all(userId);
}

export function create({ userId, name, balance = 0 }) {
  const db = getDb();
  const r = db
    .prepare(
      'INSERT INTO wallets (userId, name, balance) VALUES (?, ?, ?)'
    )
    .run(userId, name, balance);
  return db.prepare('SELECT * FROM wallets WHERE id = ?').get(r.lastInsertRowid);
}

export function update(walletId, userId, { name, balance }) {
  const db = getDb();
  const fields = [];
  const vals = [];
  if (name !== undefined) {
    fields.push('name = ?');
    vals.push(name);
  }
  if (balance !== undefined) {
    fields.push('balance = ?');
    vals.push(balance);
  }
  if (!fields.length) return findByIdForUser(walletId, userId);
  vals.push(walletId, userId);
  db.prepare(
    `UPDATE wallets SET ${fields.join(', ')} WHERE id = ? AND userId = ? AND isDeleted = 0`
  ).run(...vals);
  return findByIdForUser(walletId, userId);
}

export function softDelete(walletId, userId) {
  const db = getDb();
  db.prepare(
    'UPDATE wallets SET isDeleted = 1 WHERE id = ? AND userId = ?'
  ).run(walletId, userId);
}

export function adjustBalance(walletId, delta) {
  const db = getDb();
  db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ? AND isDeleted = 0').run(
    delta,
    walletId
  );
  return findById(walletId);
}

export function sumBalanceByUser(userId) {
  const row = getDb()
    .prepare(
      'SELECT COALESCE(SUM(balance), 0) AS total FROM wallets WHERE userId = ? AND isDeleted = 0'
    )
    .get(userId);
  return row.total;
}

export function countWallets() {
  return getDb().prepare('SELECT COUNT(*) AS c FROM wallets WHERE isDeleted = 0').get().c;
}
