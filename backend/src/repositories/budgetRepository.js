import { getDb } from '../database/db.js';

export function create({ userId, categoryId, walletId, amount, month, year }) {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO budgets (userId, categoryId, walletId, amount, month, year) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(userId, categoryId, walletId, amount, month, year);
  return findById(r.lastInsertRowid, userId);
}

export function findById(id, userId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT b.*, c.name AS categoryName, c.type AS categoryType, w.name AS walletName
       FROM budgets b
       JOIN categories c ON c.id = b.categoryId
       LEFT JOIN wallets w ON w.id = b.walletId
       WHERE b.id = ? AND b.userId = ?`
    )
    .get(id, userId);
}

/** Smallest (year, month) that has a budget row for this user — used to backfill monthly rollovers. */
export function getEarliestBudgetPeriod(userId) {
  return getDb()
    .prepare(
      `SELECT year, month FROM budgets WHERE userId = ? ORDER BY year ASC, month ASC LIMIT 1`
    )
    .get(userId);
}

export function listByUser(userId) {
  return getDb()
    .prepare(
      `SELECT b.*, c.name AS categoryName, c.type AS categoryType, w.name AS walletName
       FROM budgets b
       JOIN categories c ON c.id = b.categoryId
       LEFT JOIN wallets w ON w.id = b.walletId
       WHERE b.userId = ?
       ORDER BY b.year DESC, b.month DESC, b.id DESC`
    )
    .all(userId);
}

export function update(id, userId, data) {
  const db = getDb();
  const fields = [];
  const vals = [];
  if (data.categoryId !== undefined) {
    fields.push('categoryId = ?');
    vals.push(data.categoryId);
  }
  if (data.amount !== undefined) {
    fields.push('amount = ?');
    vals.push(data.amount);
  }
  if (data.walletId !== undefined) {
    fields.push('walletId = ?');
    vals.push(data.walletId);
  }
  if (data.month !== undefined) {
    fields.push('month = ?');
    vals.push(data.month);
  }
  if (data.year !== undefined) {
    fields.push('year = ?');
    vals.push(data.year);
  }
  if (!fields.length) return findById(id, userId);
  vals.push(id, userId);
  db.prepare(
    `UPDATE budgets SET ${fields.join(', ')} WHERE id = ? AND userId = ?`
  ).run(...vals);
  return findById(id, userId);
}

export function remove(id, userId) {
  getDb()
    .prepare('DELETE FROM budgets WHERE id = ? AND userId = ?')
    .run(id, userId);
}

export function findByUserCategoryMonthYear(userId, categoryId, month, year) {
  return getDb()
    .prepare(
      `SELECT b.*, c.name AS categoryName, c.type AS categoryType, w.name AS walletName
       FROM budgets b
       JOIN categories c ON c.id = b.categoryId
       LEFT JOIN wallets w ON w.id = b.walletId
       WHERE b.userId = ? AND b.categoryId = ? AND b.month = ? AND b.year = ?`
    )
    .get(userId, categoryId, month, year);
}

export function listByUserMonthYear(userId, month, year, walletId) {
  const db = getDb();
  let sql = `
    SELECT b.*, c.name AS categoryName, c.type AS categoryType, w.name AS walletName
    FROM budgets b
    JOIN categories c ON c.id = b.categoryId
    LEFT JOIN wallets w ON w.id = b.walletId
    WHERE b.userId = ? AND b.month = ? AND b.year = ?
  `;
  const params = [userId, month, year];
  if (walletId !== undefined && walletId !== null) {
    sql += ' AND b.walletId = ?';
    params.push(walletId);
  }
  sql += ' ORDER BY b.id ASC';
  return db.prepare(sql).all(...params);
}

export function sumAmountByUserCurrentMonth(userId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM budgets WHERE userId = ? AND month = ? AND year = ?`
    )
    .get(userId, month, year);
  return row.total;
}
