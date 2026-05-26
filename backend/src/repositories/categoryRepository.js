import { getDb } from '../database/db.js';

export function findById(id, userId) {
  return getDb().prepare('SELECT * FROM categories WHERE id = ? AND userId = ?').get(id, userId);
}

export function listAll(userId) {
  return getDb()
    .prepare('SELECT * FROM categories WHERE userId = ? ORDER BY type, name')
    .all(userId);
}

export function listByType(type, userId) {
  return getDb()
    .prepare('SELECT * FROM categories WHERE type = ? AND userId = ? ORDER BY name')
    .all(type, userId);
}

export function findByNameAndType(name, type, userId) {
  return getDb()
    .prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? AND userId = ? LIMIT 1')
    .get(name, type, userId);
}

export function create({ name, type, userId }) {
  const result = getDb()
    .prepare('INSERT INTO categories (name, type, userId) VALUES (?, ?, ?)')
    .run(name, type, userId);
  return findById(result.lastInsertRowid, userId);
}

export function update(id, { name, type }, userId) {
  getDb()
    .prepare('UPDATE categories SET name = ?, type = ? WHERE id = ? AND userId = ?')
    .run(name, type, id, userId);
  return findById(id, userId);
}

export function countUsage(id) {
  const txCount =
    getDb()
      .prepare('SELECT COUNT(*) AS c FROM transactions WHERE categoryId = ?')
      .get(id)?.c || 0;
  const budgetCount =
    getDb().prepare('SELECT COUNT(*) AS c FROM budgets WHERE categoryId = ?').get(id)?.c || 0;
  return txCount + budgetCount;
}

export function remove(id, userId) {
  getDb().prepare('DELETE FROM categories WHERE id = ? AND userId = ?').run(id, userId);
}
