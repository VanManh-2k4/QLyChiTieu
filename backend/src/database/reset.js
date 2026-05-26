import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { config } from '../config/index.js';

export function resetDatabase() {
  const dir = path.dirname(config.dbPath);
  const db = new Database(config.dbPath);
  db.pragma('foreign_keys = ON');

  console.log('Starting database reset...');

  // Disable foreign key constraints temporarily for easier deletion
  db.pragma('foreign_keys = OFF');

  try {
    // Clear all user-generated data
    console.log('Clearing transactions...');
    db.prepare('DELETE FROM transactions').run();

    console.log('Clearing savings transfers...');
    db.prepare('DELETE FROM savings_transfers').run();

    console.log('Clearing savings accounts...');
    db.prepare('DELETE FROM savings_accounts').run();

    console.log('Clearing budgets...');
    db.prepare('DELETE FROM budgets').run();

    console.log('Clearing activity logs...');
    db.prepare('DELETE FROM activity_logs').run();

    console.log('Clearing monthly rollovers...');
    db.prepare('DELETE FROM monthly_rollovers').run();

    console.log('Clearing password resets...');
    db.prepare('DELETE FROM password_resets').run();

    console.log('Clearing backup codes...');
    db.prepare('DELETE FROM user_backup_codes').run();

    // Reset wallets to 0 balance
    console.log('Resetting wallet balances...');
    db.prepare('UPDATE wallets SET balance = 0 WHERE isDeleted = 0').run();

    // Re-enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // Keep test user and categories - they are part of the initial state
    // Verify test user exists, if not recreate it
    const testUserExists = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get('user@test.com');

    if (!testUserExists) {
      console.log('Recreating test user...');
      const hash = bcrypt.hashSync('123456', 10);
      const insertUser = db.prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      );
      const info = insertUser.run('User', 'user@test.com', hash, 'user');

      // Add wallets for test user
      const insertWallet = db.prepare(`
        INSERT INTO wallets (userId, name, balance) VALUES (?, ?, ?)
      `);
      insertWallet.run(info.lastInsertRowid, 'Ví chính', 0);
      insertWallet.run(info.lastInsertRowid, 'Ví tiền mặt', 0);
    }

    console.log('✓ Database reset successfully!');
    console.log('Initial state restored:');
    console.log('  - Test user: user@test.com (password: 123456)');
    console.log('  - All user data cleared (transactions, budgets, savings, etc.)');
    console.log('  - Categories preserved');
    console.log('  - Wallet balances reset to 0');

    db.close();
  } catch (error) {
    db.pragma('foreign_keys = ON');
    db.close();
    console.error('Error during database reset:', error);
    throw error;
  }
}

const invokedPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
if (invokedPath && import.meta.url.endsWith(invokedPath.split('/').pop())) {
  resetDatabase();
}

export default resetDatabase;
