import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// CRITICAL: Require JWT_SECRET to be set in production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET environment variable for production!');
}

// CRITICAL: Require TWO_FACTOR_ENCRYPTION_KEY to be set in production
if (!process.env.TWO_FACTOR_ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY environment variable is required in production');
  }
  console.warn('⚠️  WARNING: Using default TWO_FACTOR_ENCRYPTION_KEY. Set TWO_FACTOR_ENCRYPTION_KEY environment variable for production!');
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  twoFactorEncryptionKey:
    process.env.TWO_FACTOR_ENCRYPTION_KEY || 'dev-2fa-key-change-in-production',
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.join(__dirname, '../../database/db.sqlite'),
};
