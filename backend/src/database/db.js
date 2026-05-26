import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return dbInstance;
}

export function initDb() {
  const dir = path.dirname(config.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new Database(config.dbPath);
  dbInstance.pragma('foreign_keys = ON');

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      isDeleted INTEGER DEFAULT 0,
      twoFactorEnabled INTEGER DEFAULT 0,
      twoFactorSecretEnc TEXT,
      twoFactorTempSecretEnc TEXT,
      twoFactorTempExpiresAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      isDeleted INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      walletId INTEGER NOT NULL,
      categoryId INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount REAL NOT NULL CHECK(amount > 0),
      note TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (walletId) REFERENCES wallets(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      categoryId INTEGER NOT NULL,
      walletId INTEGER NOT NULL,
      amount REAL NOT NULL,
      month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
      year INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (walletId) REFERENCES wallets(id),
      UNIQUE(userId, categoryId, month, year)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tokenHash TEXT NOT NULL,
      expiresAt DATETIME NOT NULL,
      usedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(userId);
    CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(tokenHash);

    CREATE TABLE IF NOT EXISTS user_backup_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      codeHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      usedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON user_backup_codes(userId);

    CREATE TABLE IF NOT EXISTS savings_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0,
      isDeleted INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_savings_user ON savings_accounts(userId);

    CREATE TABLE IF NOT EXISTS savings_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      walletId INTEGER NOT NULL,
      savingsId INTEGER NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('deposit','withdraw')),
      amount REAL NOT NULL CHECK(amount > 0),
      note TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (walletId) REFERENCES wallets(id),
      FOREIGN KEY (savingsId) REFERENCES savings_accounts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_savings_transfers_user_date ON savings_transfers(userId, date);

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      actionType TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      title TEXT NOT NULL,
      details TEXT,
      amount REAL,
      occurredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(userId, occurredAt);

    CREATE TABLE IF NOT EXISTS monthly_rollovers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      rolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, year, month),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_monthly_rollovers_user ON monthly_rollovers(userId);

    CREATE TABLE IF NOT EXISTS saving_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      walletId INTEGER NOT NULL,
      name TEXT NOT NULL,
      targetAmount REAL NOT NULL CHECK(targetAmount > 0),
      currentAmount REAL DEFAULT 0 CHECK(currentAmount >= 0),
      targetDate DATETIME NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','overdue')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (walletId) REFERENCES wallets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_saving_goals_user ON saving_goals(userId);
    CREATE INDEX IF NOT EXISTS idx_saving_goals_status ON saving_goals(status);

    CREATE TABLE IF NOT EXISTS saving_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goalId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      walletId INTEGER NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('deposit','withdraw')),
      note TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goalId) REFERENCES saving_goals(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (walletId) REFERENCES wallets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_saving_transactions_goal ON saving_transactions(goalId);
    CREATE INDEX IF NOT EXISTS idx_saving_transactions_user_date ON saving_transactions(userId, date);

    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(userId, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(userId, type);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(userId);
  `);

  migrate(dbInstance);
  seedIfNeeded(dbInstance);
  return dbInstance;
}

function migrate(db) {
  // Enforce case-insensitive uniqueness for email
  db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_nocase ON users(email COLLATE NOCASE);`
  );

  // Add 2FA-related columns for existing databases created before this feature
  const userCols = db.prepare(`PRAGMA table_info(users)`).all();
  const hasCol = (name) => userCols.some((c) => c.name === name);

  if (!hasCol('twoFactorEnabled')) {
    db.exec(`ALTER TABLE users ADD COLUMN twoFactorEnabled INTEGER DEFAULT 0;`);
  }
  if (!hasCol('twoFactorSecretEnc')) {
    db.exec(`ALTER TABLE users ADD COLUMN twoFactorSecretEnc TEXT;`);
  }
  if (!hasCol('twoFactorTempSecretEnc')) {
    db.exec(`ALTER TABLE users ADD COLUMN twoFactorTempSecretEnc TEXT;`);
  }
  if (!hasCol('twoFactorTempExpiresAt')) {
    db.exec(`ALTER TABLE users ADD COLUMN twoFactorTempExpiresAt DATETIME;`);
  }
  if (!hasCol('avatar')) {
    db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT;`);
  }
  if (!hasCol('updatedAt')) {
    db.exec(`ALTER TABLE users ADD COLUMN updatedAt DATETIME;`);
    db.exec(`UPDATE users SET updatedAt = createdAt WHERE updatedAt IS NULL;`);
  }

  // Migrate categories to add userId for existing databases
  const categoryCols = db.prepare(`PRAGMA table_info(categories)`).all();
  const hasCategoryUserId = categoryCols.some((c) => c.name === 'userId');
  if (!hasCategoryUserId) {
    db.exec(`ALTER TABLE categories ADD COLUMN userId INTEGER;`);
    // Assign existing categories to the first user
    db.exec(`
      UPDATE categories
      SET userId = (
        SELECT id FROM users WHERE isDeleted = 0 ORDER BY id ASC LIMIT 1
      )
      WHERE userId IS NULL
    `);
    // Add foreign key constraint (SQLite doesn't support adding FK directly, need to recreate table)
    // For now, we'll rely on application-level validation
  }

  const budgetCols = db.prepare(`PRAGMA table_info(budgets)`).all();
  const hasBudgetWalletCol = budgetCols.some((c) => c.name === 'walletId');
  if (!hasBudgetWalletCol) {
    db.exec(`ALTER TABLE budgets ADD COLUMN walletId INTEGER;`);
    db.exec(`
      UPDATE budgets
      SET walletId = (
        SELECT w.id
        FROM wallets w
        WHERE w.userId = budgets.userId AND w.isDeleted = 0
        ORDER BY w.id ASC
        LIMIT 1
      )
      WHERE walletId IS NULL
    `);
  }

  // Ensure each user has a cash wallet for easy physical money tracking.
  db.exec(`
    INSERT INTO wallets (userId, name, balance)
    SELECT u.id, 'Ví tiền mặt', 0
    FROM users u
    WHERE u.isDeleted = 0
      AND NOT EXISTS (
        SELECT 1
        FROM wallets w
        WHERE w.userId = u.id
          AND w.isDeleted = 0
          AND LOWER(w.name) = LOWER('Ví tiền mặt')
      )
  `);

  ensurePresetCategories(db);
  // Wallet balance is maintained by services (transactions, budgets, savings). Never reset on startup.
}

function seedIfNeeded(db) {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) return;

  const hash = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  );
  const info = insertUser.run('User', 'user@test.com', hash, 'user');

  const insertWallet = db.prepare(`
    INSERT INTO wallets (userId, name, balance) VALUES (?, ?, ?)
  `);
  insertWallet.run(info.lastInsertRowid, 'Ví chính', 0);
  insertWallet.run(info.lastInsertRowid, 'Ví tiền mặt', 0);

  ensurePresetCategories(db);
}

export function ensurePresetCategories(db) {
  const presetCategories = [
    ['Ăn uống', 'expense'],
    ['Chi tiêu hằng ngày', 'expense'],
    ['Quần áo', 'expense'],
    ['Mỹ phẩm', 'expense'],
    ['Giáo dục', 'expense'],
    ['Phí giao lưu', 'expense'],
    ['Y tế', 'expense'],
    ['Tiền điện', 'expense'],
    ['Đi lại', 'expense'],
    ['Phí liên lạc', 'expense'],
    ['Tiền nhà', 'expense'],
    ['Tiền lương', 'income'],
    ['Tiền phụ cấp', 'income'],
    ['Tiền thưởng', 'income'],
    ['Thu nhập thêm', 'income'],
    ['Đầu tư', 'income'],
    ['Thu nhập khác', 'income'],
    ['Tiền hoàn', 'income'],
  ];

  // Get all users
  const users = db.prepare('SELECT id FROM users WHERE isDeleted = 0').all();
  
  const insertCategory = db.prepare('INSERT INTO categories (userId, name, type) VALUES (?, ?, ?)');
  
  users.forEach((user) => {
    presetCategories.forEach(([name, type]) => {
      const hasCategory = db.prepare(
        'SELECT id FROM categories WHERE userId = ? AND LOWER(name) = LOWER(?) AND type = ? LIMIT 1'
      );
      const existed = hasCategory.get(user.id, name, type);
      if (!existed) {
        insertCategory.run(user.id, name, type);
      }
    });
  });
}
