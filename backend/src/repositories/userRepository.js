import { getDb } from '../database/db.js';

export function findByEmail(email) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE AND isDeleted = 0')
    .get(email);
}

export function findById(id) {
  const db = getDb();
  return db
    .prepare(
      'SELECT id, name, email, password, role, avatar, createdAt, updatedAt, isDeleted, twoFactorEnabled, twoFactorSecretEnc, twoFactorTempSecretEnc, twoFactorTempExpiresAt FROM users WHERE id = ?'
    )
    .get(id);
}

export function create({ name, email, password, role = 'user' }) {
  const db = getDb();
  const r = db
    .prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    )
    .run(name, email, password, role);
  return findById(r.lastInsertRowid);
}

export function update(id, { name, email, password, avatar }) {
  const db = getDb();
  const fields = [];
  const vals = [];
  if (name !== undefined) {
    fields.push('name = ?');
    vals.push(name);
  }
  if (email !== undefined) {
    fields.push('email = ?');
    vals.push(email);
  }
  if (password !== undefined) {
    fields.push('password = ?');
    vals.push(password);
  }
  if (avatar !== undefined) {
    fields.push('avatar = ?');
    vals.push(avatar);
  }
  if (fields.length > 0) {
    // Check if updatedAt column exists before trying to update it
    const cols = db.prepare(`PRAGMA table_info(users)`).all();
    const hasUpdatedAt = cols.some((c) => c.name === 'updatedAt');
    if (hasUpdatedAt) {
      fields.push('updatedAt = CURRENT_TIMESTAMP');
    }
  }
  if (!fields.length) return findById(id);
  vals.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  return findById(id);
}

export function updateTwoFactor(id, data) {
  const db = getDb();
  const fields = [];
  const vals = [];
  if (data.twoFactorEnabled !== undefined) {
    fields.push('twoFactorEnabled = ?');
    vals.push(data.twoFactorEnabled);
  }
  if (data.twoFactorSecretEnc !== undefined) {
    fields.push('twoFactorSecretEnc = ?');
    vals.push(data.twoFactorSecretEnc);
  }
  if (data.twoFactorTempSecretEnc !== undefined) {
    fields.push('twoFactorTempSecretEnc = ?');
    vals.push(data.twoFactorTempSecretEnc);
  }
  if (data.twoFactorTempExpiresAt !== undefined) {
    fields.push('twoFactorTempExpiresAt = ?');
    vals.push(data.twoFactorTempExpiresAt);
  }
  if (!fields.length) return findById(id);
  vals.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  return findById(id);
}

export function listAll({ page = 1, limit = 20 }) {
  const db = getDb();
  const offset = (page - 1) * limit;
  const rows = db
    .prepare(
      `SELECT id, name, email, role, createdAt, isDeleted FROM users ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  return { rows, total, page, limit };
}

export function updateAdminFields(id, { role, isDeleted }) {
  const db = getDb();
  const fields = [];
  const vals = [];
  if (role !== undefined) {
    fields.push('role = ?');
    vals.push(role);
  }
  if (isDeleted !== undefined) {
    fields.push('isDeleted = ?');
    vals.push(isDeleted);
  }
  if (!fields.length) return findById(id);
  vals.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  return findById(id);
}

export function countUsers() {
  return getDb().prepare('SELECT COUNT(*) AS c FROM users WHERE isDeleted = 0').get().c;
}
