import { getDb } from '../database/db.js';

export function replaceAllForUser(userId, codeHashes) {
  const db = getDb();
  const run = db.transaction(() => {
    db.prepare(`DELETE FROM user_backup_codes WHERE userId = ?`).run(userId);
    const stmt = db.prepare(
      `INSERT INTO user_backup_codes (userId, codeHash) VALUES (?, ?)`
    );
    for (const h of codeHashes) {
      stmt.run(userId, h);
    }
  });
  run();
}

export function consumeIfValid(userId, codeHash) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM user_backup_codes WHERE userId = ? AND codeHash = ? AND usedAt IS NULL LIMIT 1`
    )
    .get(userId, codeHash);
  if (!row) return false;
  db.prepare(`UPDATE user_backup_codes SET usedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(
    row.id
  );
  return true;
}

export function clearAll(userId) {
  getDb().prepare(`DELETE FROM user_backup_codes WHERE userId = ?`).run(userId);
}

