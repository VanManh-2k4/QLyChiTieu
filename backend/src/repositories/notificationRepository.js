import { getDb } from '../database/db.js';

export function findByUserId(userId, { limit = 20, offset = 0, type, isRead } = {}) {
  const db = getDb();
  let whereClause = 'WHERE userId = ?';
  const params = [userId];
  
  if (type) {
    // Handle comma-separated types
    const types = type.split(',').map(t => t.trim());
    const placeholders = types.map(() => '?').join(',');
    whereClause += ` AND type IN (${placeholders})`;
    params.push(...types);
  }
  
  if (isRead !== undefined) {
    whereClause += ' AND isRead = ?';
    params.push(isRead);
  }
  
  const rows = db
    .prepare(
      `SELECT * FROM notifications ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);
    
  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM notifications ${whereClause}`)
    .get(...params).c;
    
  return { rows, total, limit, offset };
}

export function findById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

export function create({ userId, type, title, message }) {
  const db = getDb();
  const r = db
    .prepare(
      'INSERT INTO notifications (userId, type, title, message) VALUES (?, ?, ?, ?)'
    )
    .run(userId, type, title, message);
  return findById(r.lastInsertRowid);
}

export function markAsRead(id) {
  const db = getDb();
  db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(id);
  return findById(id);
}

export function markAllAsRead(userId) {
  const db = getDb();
  db
    .prepare('UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0')
    .run(userId);
}

export function deleteNotification(id) {
  const db = getDb();
  db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
}

export function countUnread(userId) {
  const db = getDb();
  return db
    .prepare('SELECT COUNT(*) AS c FROM notifications WHERE userId = ? AND isRead = 0')
    .get(userId).c;
}

export function deleteAll(userId) {
  const db = getDb();
  db.prepare('DELETE FROM notifications WHERE userId = ?').run(userId);
}
