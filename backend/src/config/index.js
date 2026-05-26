import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  twoFactorEncryptionKey:
    process.env.TWO_FACTOR_ENCRYPTION_KEY || 'dev-2fa-key-change-in-production',
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: path.join(__dirname, '../../database/db.sqlite'),
};
