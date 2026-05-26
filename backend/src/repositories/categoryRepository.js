import { getDb } from '../database/db.js';

export function findById(id) {
  return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function listAll() {
  return getDb()
    .prepare('SELECT * FROM categories ORDER BY type, name')
    .all();
}

export function listByType(type) {
  return getDb()
    .prepare('SELECT * FROM categories WHERE type = ? ORDER BY name')
    .all(type);
}

export function findByNameAndType(name, type) {
  return getDb()
    .prepare('SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND type = ? LIMIT 1')
    .get(name, type);
}

export function create({ name, type }) {
  const result = getDb()
    .prepare('INSERT INTO categories (name, type) VALUES (?, ?)')
    .run(name, type);
  return findById(result.lastInsertRowid);
}

export function update(id, { name, type }) {
  getDb()
    .prepare('UPDATE categories SET name = ?, type = ? WHERE id = ?')
    .run(name, type, id);
  return findById(id);
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

export function remove(id) {
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
}
