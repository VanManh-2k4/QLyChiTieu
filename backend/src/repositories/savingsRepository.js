import { getDb } from '../database/db.js';

export function listAccounts(userId) {
  return getDb()
    .prepare(
      `SELECT * FROM savings_accounts WHERE userId = ? AND isDeleted = 0 ORDER BY id DESC`
    )
    .all(userId);
}

export function findAccountForUser(id, userId) {
  return getDb()
    .prepare(
      `SELECT * FROM savings_accounts WHERE id = ? AND userId = ? AND isDeleted = 0`
    )
    .get(id, userId);
}

export function createAccount({ userId, name, balance = 0 }) {
  const db = getDb();
  const r = db
    .prepare(`INSERT INTO savings_accounts (userId, name, balance) VALUES (?, ?, ?)`)
    .run(userId, name, balance);
  return db.prepare(`SELECT * FROM savings_accounts WHERE id = ?`).get(r.lastInsertRowid);
}

export function updateAccount(id, userId, { name, balance }) {
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
  if (!fields.length) return findAccountForUser(id, userId);
  vals.push(id, userId);
  db.prepare(
    `UPDATE savings_accounts SET ${fields.join(', ')} WHERE id = ? AND userId = ? AND isDeleted = 0`
  ).run(...vals);
  return findAccountForUser(id, userId);
}

export function softDeleteAccount(id, userId) {
  getDb()
    .prepare(`UPDATE savings_accounts SET isDeleted = 1 WHERE id = ? AND userId = ?`)
    .run(id, userId);
}

export function adjustSavingsBalance(id, delta) {
  const db = getDb();
  db.prepare(
    `UPDATE savings_accounts SET balance = balance + ? WHERE id = ? AND isDeleted = 0`
  ).run(delta, id);
  return db.prepare(`SELECT * FROM savings_accounts WHERE id = ?`).get(id);
}

export function insertTransfer({
  userId,
  walletId,
  savingsId,
  direction,
  amount,
  note,
  date,
}) {
  const db = getDb();
  const d = date ? new Date(date).toISOString() : new Date().toISOString();
  const r = db
    .prepare(
      `INSERT INTO savings_transfers (userId, walletId, savingsId, direction, amount, note, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, walletId, savingsId, direction, amount, note ?? null, d);
  return db.prepare(`SELECT * FROM savings_transfers WHERE id = ?`).get(r.lastInsertRowid);
}

export function listTransfers(userId, { page = 1, limit = 20 } = {}) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const rows = db
    .prepare(
      `
      SELECT st.*, w.name AS walletName, sa.name AS savingsName
      FROM savings_transfers st
      JOIN wallets w ON w.id = st.walletId
      JOIN savings_accounts sa ON sa.id = st.savingsId
      WHERE st.userId = ?
      ORDER BY st.date DESC, st.id DESC
      LIMIT ? OFFSET ?
    `
    )
    .all(userId, limit, offset);
  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM savings_transfers WHERE userId = ?`)
    .get(userId).c;
  return { rows, total, page, limit };
}

export function sumSavingsBalanceByUser(userId) {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(balance), 0) AS total FROM savings_accounts WHERE userId = ? AND isDeleted = 0`
    )
    .get(userId);
  return row.total;
}

export function sumTransfersByDirectionInRange(userId, { dateFrom, dateTo } = {}) {
  const db = getDb();
  let sql = `
    SELECT st.direction, COALESCE(SUM(st.amount), 0) AS total
    FROM savings_transfers st
    WHERE st.userId = ?
  `;
  const params = [userId];
  if (dateFrom) {
    sql += ' AND date(st.date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(st.date) <= date(?)';
    params.push(dateTo);
  }
  sql += ' GROUP BY st.direction';
  return db.prepare(sql).all(...params);
}

export function listTransfersInRange(userId, { dateFrom, dateTo } = {}, { page = 1, limit = 20 } = {}) {
  const db = getDb();
  const offset = (page - 1) * limit;
  let sql = `
    SELECT st.*, w.name AS walletName, sa.name AS savingsName
    FROM savings_transfers st
    JOIN wallets w ON w.id = st.walletId
    JOIN savings_accounts sa ON sa.id = st.savingsId
    WHERE st.userId = ?
  `;
  const params = [userId];
  if (dateFrom) {
    sql += ' AND date(st.date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(st.date) <= date(?)';
    params.push(dateTo);
  }
  sql += ' ORDER BY st.date DESC, st.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);

  let countSql = `SELECT COUNT(*) AS c FROM savings_transfers st WHERE st.userId = ?`;
  const countParams = [userId];
  if (dateFrom) {
    countSql += ' AND date(st.date) >= date(?)';
    countParams.push(dateFrom);
  }
  if (dateTo) {
    countSql += ' AND date(st.date) <= date(?)';
    countParams.push(dateTo);
  }
  const total = db.prepare(countSql).get(...countParams).c;

  return { rows, total, page, limit };
}

