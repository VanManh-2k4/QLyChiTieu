import { getDb } from '../database/db.js';

export function createReset({ userId, tokenHash, expiresAt }) {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO password_resets (userId, tokenHash, expiresAt) VALUES (?, ?, ?)`
    )
    .run(userId, tokenHash, expiresAt);
  return db.prepare(`SELECT * FROM password_resets WHERE id = ?`).get(r.lastInsertRowid);
}

export function findValidByTokenHash(tokenHash) {
  const db = getDb();
  return db
    .prepare(
      `
      SELECT * FROM password_resets
      WHERE tokenHash = ?
        AND usedAt IS NULL
        AND datetime(expiresAt) > datetime('now')
      ORDER BY id DESC
      LIMIT 1
    `
    )
    .get(tokenHash);
}

export function markUsed(id) {
  getDb()
    .prepare(`UPDATE password_resets SET usedAt = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(id);
}

export function invalidateAllForUser(userId) {
  getDb()
    .prepare(
      `UPDATE password_resets SET usedAt = COALESCE(usedAt, CURRENT_TIMESTAMP) WHERE userId = ?`
    )
    .run(userId);
}

