import crypto from 'crypto';
import { config } from '../config/index.js';

function keyFromConfig() {
  // Derive a 32-byte key regardless of input length
  return crypto.createHash('sha256').update(String(config.twoFactorEncryptionKey)).digest();
}

export function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function encryptText(plain) {
  const iv = crypto.randomBytes(12);
  const key = keyFromConfig();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${ciphertext.toString('hex')}`;
}

export function decryptText(enc) {
  const [ivHex, tagHex, dataHex] = String(enc || '').split('.');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid encrypted payload');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const key = keyFromConfig();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString('utf8');
}

