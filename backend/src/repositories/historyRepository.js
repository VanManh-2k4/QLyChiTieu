import { getDb } from '../database/db.js';

export function createActivity({
  userId,
  actionType,
  entityType,
  entityId = null,
  title,
  details = null,
  amount = null,
  occurredAt = null,
}) {
  const db = getDb();
  const at = occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO activity_logs
      (userId, actionType, entityType, entityId, title, details, amount, occurredAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, actionType, entityType, entityId, title, details, amount, at);
  return db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(result.lastInsertRowid);
}

export function listActivities(userId, { dateFrom, dateTo } = {}) {
  const db = getDb();
  let sql = `
    SELECT
      id,
      occurredAt,
      actionType,
      entityType,
      entityId,
      title,
      details,
      amount
    FROM activity_logs
    WHERE userId = ?
      AND entityType NOT IN ('transaction', 'savings_transfer')
  `;
  const params = [userId];
  if (dateFrom) {
    sql += ' AND date(occurredAt) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(occurredAt) <= date(?)';
    params.push(dateTo);
  }
  sql += ' ORDER BY occurredAt DESC, id DESC';
  return db.prepare(sql).all(...params);
}

export function listTransactionsAsHistory(userId, { dateFrom, dateTo } = {}) {
  const db = getDb();
  let sql = `
    SELECT
      t.id,
      t.date AS occurredAt,
      'transaction' AS actionType,
      'transaction' AS entityType,
      t.id AS entityId,
      CASE WHEN t.type = 'income' THEN 'Ghi nhận thu nhập' ELSE 'Ghi nhận chi tiêu' END AS title,
      ('Danh mục: ' || c.name || ' | Ví: ' || w.name || COALESCE(' | Ghi chú: ' || t.note, '')) AS details,
      t.amount AS amount
    FROM transactions t
    JOIN categories c ON c.id = t.categoryId
    JOIN wallets w ON w.id = t.walletId
    WHERE t.userId = ?
  `;
  const params = [userId];
  if (dateFrom) {
    sql += ' AND date(t.date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(t.date) <= date(?)';
    params.push(dateTo);
  }
  sql += ' ORDER BY t.date DESC, t.id DESC';
  return db.prepare(sql).all(...params);
}

export function listSavingsTransfersAsHistory(userId, { dateFrom, dateTo } = {}) {
  const db = getDb();
  let sql = `
    SELECT
      st.id,
      st.date AS occurredAt,
      'savings_transfer' AS actionType,
      'savings' AS entityType,
      st.id AS entityId,
      CASE WHEN st.direction = 'deposit' THEN 'Chuyển ví sang quỹ tiết kiệm' ELSE 'Rút từ quỹ tiết kiệm về ví' END AS title,
      ('Ví: ' || w.name || ' | Quỹ: ' || sa.name || COALESCE(' | Ghi chú: ' || st.note, '')) AS details,
      st.amount AS amount
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
  sql += ' ORDER BY st.date DESC, st.id DESC';
  return db.prepare(sql).all(...params);
}

export function listGoalTransactionsAsHistory(userId, { dateFrom, dateTo } = {}) {
  const db = getDb();
  let sql = `
    SELECT
      gt.id,
      gt.date AS occurredAt,
      CASE WHEN gt.type = 'deposit' THEN 'goal_deposit' ELSE 'goal_withdraw' END AS actionType,
      'goal' AS entityType,
      gt.id AS entityId,
      CASE WHEN gt.type = 'deposit' THEN 'Thêm tiền vào mục tiêu tiết kiệm' ELSE 'Rút tiền từ mục tiêu tiết kiệm' END AS title,
      ('Mục tiêu: ' || g.name || ' | Ví: ' || w.name || COALESCE(' | Ghi chú: ' || gt.note, '')) AS details,
      gt.amount AS amount
    FROM saving_transactions gt
    JOIN saving_goals g ON g.id = gt.goalId
    JOIN wallets w ON w.id = gt.walletId
    WHERE gt.userId = ?
  `;
  const params = [userId];
  if (dateFrom) {
    sql += ' AND date(gt.date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(gt.date) <= date(?)';
    params.push(dateTo);
  }
  sql += ' ORDER BY gt.date DESC, gt.id DESC';
  return db.prepare(sql).all(...params);
}

export function getLatestRollover(userId) {
  return getDb()
    .prepare(
      `SELECT * FROM monthly_rollovers WHERE userId = ? ORDER BY year DESC, month DESC LIMIT 1`
    )
    .get(userId);
}

export function upsertRollover(userId, year, month) {
  getDb()
    .prepare(
      `INSERT INTO monthly_rollovers (userId, year, month, rolledAt)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(userId, year, month) DO UPDATE SET rolledAt = CURRENT_TIMESTAMP`
    )
    .run(userId, year, month);
}
