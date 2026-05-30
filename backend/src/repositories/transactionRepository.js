import { getDb } from '../database/db.js';

export function insert({
  userId,
  walletId,
  categoryId,
  type,
  amount,
  note,
  date,
}) {
  const db = getDb();
  const d = date ? new Date(date).toISOString() : new Date().toISOString();
  const r = db
    .prepare(
      `INSERT INTO transactions (userId, walletId, categoryId, type, amount, note, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, walletId, categoryId, type, amount, note ?? null, d);
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(r.lastInsertRowid);
}

export function listForUser(userId, filters, pagination) {
  const db = getDb();
  const { dateFrom, dateTo, type, categoryId } = filters;
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT t.*, c.name AS categoryName, w.name AS walletName
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
  if (type) {
    sql += ' AND t.type = ?';
    params.push(type);
  }
  if (categoryId) {
    sql += ' AND t.categoryId = ?';
    params.push(categoryId);
  }

  sql += ' ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);

  let countSql = `SELECT COUNT(*) AS c FROM transactions t WHERE t.userId = ?`;
  const countParams = [userId];
  if (dateFrom) {
    countSql += ' AND date(t.date) >= date(?)';
    countParams.push(dateFrom);
  }
  if (dateTo) {
    countSql += ' AND date(t.date) <= date(?)';
    countParams.push(dateTo);
  }
  if (type) {
    countSql += ' AND t.type = ?';
    countParams.push(type);
  }
  if (categoryId) {
    countSql += ' AND t.categoryId = ?';
    countParams.push(categoryId);
  }
  const total = db.prepare(countSql).get(...countParams).c;

  return { rows, total, page, limit };
}

export function sumByType(userId, { dateFrom, dateTo, type, excludeRefundCategory = false }) {
  const db = getDb();
  let sql = `SELECT COALESCE(SUM(t.amount), 0) AS s FROM transactions t`;
  const params = [];
  
  if (excludeRefundCategory && type === 'income') {
    sql += ` JOIN categories c ON c.id = t.categoryId`;
  }
  
  sql += ` WHERE t.userId = ?`;
  params.push(userId);
  
  if (dateFrom) {
    sql += ' AND date(t.date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(t.date) <= date(?)';
    params.push(dateTo);
  }
  if (type) {
    sql += ' AND t.type = ?';
    params.push(type);
  }
  if (excludeRefundCategory && type === 'income') {
    sql += ' AND LOWER(c.name) != LOWER(?)';
    params.push('Tiền hoàn');
  }
  return db.prepare(sql).get(...params).s;
}

export function expenseByCategory(userId, { dateFrom, dateTo }) {
  const db = getDb();
  let sql = `
    SELECT c.id AS categoryId, c.name AS name, COALESCE(SUM(t.amount), 0) AS value
    FROM categories c
    INNER JOIN transactions t ON t.categoryId = c.id AND t.userId = ? AND t.type = 'expense'
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
  sql +=
    ' GROUP BY c.id, c.name HAVING SUM(t.amount) > 0 ORDER BY SUM(t.amount) DESC';
  return db.prepare(sql).all(...params);
}

export function incomeByCategory(userId, { dateFrom, dateTo, excludeRefundCategory = false }) {
  const db = getDb();
  let sql = `
    SELECT c.id AS categoryId, c.name AS name, COALESCE(SUM(t.amount), 0) AS value
    FROM categories c
    INNER JOIN transactions t ON t.categoryId = c.id AND t.userId = ? AND t.type = 'income'
  `;
  const params = [userId];
  if (excludeRefundCategory) {
    sql += ' AND LOWER(c.name) != LOWER(?)';
    params.push('Tiền hoàn');
  }
  if (dateFrom) {
    sql += ' AND date(t.date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(t.date) <= date(?)';
    params.push(dateTo);
  }
  sql +=
    ' GROUP BY c.id, c.name HAVING SUM(t.amount) > 0 ORDER BY SUM(t.amount) DESC';
  return db.prepare(sql).all(...params);
}

export function incomeExpenseByDay(userId, dateFrom, dateTo) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT
      date(t.date) AS day,
      SUM(CASE WHEN t.type = 'income' AND LOWER(c.name) != LOWER('Tiền hoàn') THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense
    FROM transactions t
    JOIN categories c ON c.id = t.categoryId
    WHERE t.userId = ? AND date(t.date) >= date(?) AND date(t.date) <= date(?)
    GROUP BY date(t.date)
    ORDER BY day ASC
  `
    )
    .all(userId, dateFrom, dateTo);
}

export function incomeExpenseByMonthInRange(userId, { dateFrom, dateTo }) {
  const db = getDb();
  let sql = `
    SELECT
      strftime('%Y-%m', t.date) AS period,
      CAST(strftime('%Y', t.date) AS INTEGER) AS year,
      CAST(strftime('%m', t.date) AS INTEGER) AS month,
      SUM(CASE WHEN t.type = 'income' AND LOWER(c.name) != LOWER('Tiền hoàn') THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense
    FROM transactions t
    JOIN categories c ON c.id = t.categoryId
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
  sql += ` GROUP BY strftime('%Y-%m', t.date) ORDER BY period ASC`;
  return db.prepare(sql).all(...params);
}

export function incomeExpenseByMonthRecent(userId, limitMonths = 36) {
  const db = getDb();
  const rows = db
    .prepare(
      `
    SELECT
      strftime('%Y-%m', t.date) AS period,
      CAST(strftime('%Y', t.date) AS INTEGER) AS year,
      CAST(strftime('%m', t.date) AS INTEGER) AS month,
      SUM(CASE WHEN t.type = 'income' AND LOWER(c.name) != LOWER('Tiền hoàn') THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense
    FROM transactions t
    JOIN categories c ON c.id = t.categoryId
    WHERE t.userId = ?
    GROUP BY strftime('%Y-%m', t.date)
    ORDER BY period DESC
    LIMIT ?
  `
    )
    .all(userId, limitMonths);
  return rows.reverse();
}

export function monthlyTotals(userId, year) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT
      CAST(strftime('%m', t.date) AS INTEGER) AS month,
      SUM(CASE WHEN t.type = 'income' AND LOWER(c.name) != LOWER('Tiền hoàn') THEN t.amount ELSE 0 END) AS income,
      SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense
    FROM transactions t
    JOIN categories c ON c.id = t.categoryId
    WHERE t.userId = ? AND strftime('%Y', t.date) = ?
    GROUP BY strftime('%m', t.date)
    ORDER BY month
  `
    )
    .all(userId, String(year));
}

export function countTransactions() {
  return getDb().prepare('SELECT COUNT(*) AS c FROM transactions').get().c;
}

export function sumExpenseForBudget(userId, categoryId, month, year) {
  const db = getDb();
  const row = db
    .prepare(
      `
    SELECT COALESCE(SUM(t.amount), 0) AS s FROM transactions t
    WHERE t.userId = ? AND t.categoryId = ? AND t.type = 'expense'
      AND CAST(strftime('%m', t.date) AS INTEGER) = ?
      AND CAST(strftime('%Y', t.date) AS INTEGER) = ?
  `
    )
    .get(userId, categoryId, month, year);
  return row.s;
}

export function listExpensesForBudget(userId, categoryId, month, year) {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT t.id, t.walletId, w.name AS walletName, t.amount, t.note, t.date
    FROM transactions t
    JOIN wallets w ON w.id = t.walletId
    WHERE t.userId = ? AND t.categoryId = ? AND t.type = 'expense'
      AND CAST(strftime('%m', t.date) AS INTEGER) = ?
      AND CAST(strftime('%Y', t.date) AS INTEGER) = ?
    ORDER BY t.date DESC, t.id DESC
  `
    )
    .all(userId, categoryId, month, year);
}

export function findById(id, userId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT t.*, c.name AS categoryName, w.name AS walletName
       FROM transactions t
       JOIN categories c ON c.id = t.categoryId
       JOIN wallets w ON w.id = t.walletId
       WHERE t.id = ? AND t.userId = ?`
    )
    .get(id, userId);
}

export function update(id, { walletId, categoryId, type, amount, note, date }) {
  const db = getDb();
  const d = date ? new Date(date).toISOString() : new Date().toISOString();
  const r = db
    .prepare(
      `UPDATE transactions
       SET walletId = ?, categoryId = ?, type = ?, amount = ?, note = ?, date = ?
       WHERE id = ?`
    )
    .run(walletId, categoryId, type, amount, note ?? null, d, id);
  if (r.changes === 0) {
    return null;
  }
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
}

export function deleteTransaction(id, userId) {
  const db = getDb();
  const r = db
    .prepare('DELETE FROM transactions WHERE id = ? AND userId = ?')
    .run(id, userId);
  return r.changes > 0;
}
