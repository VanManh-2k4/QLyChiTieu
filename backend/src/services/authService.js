import * as userRepository from '../repositories/userRepository.js';
import * as walletRepository from '../repositories/walletRepository.js';
import * as passwordResetRepository from '../repositories/passwordResetRepository.js';
import * as backupCodeRepository from '../repositories/backupCodeRepository.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import { config } from '../config/index.js';
import { decryptText, encryptText, randomToken, sha256Hex } from '../utils/crypto.js';
import speakeasy from 'speakeasy';
import { getDb, ensurePresetCategoriesForUser } from '../database/db.js';

export function register({ name, email, password }) {
  const cleanName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = userRepository.findByEmail(normalizedEmail);
  if (existing) {
    const err = new Error('Email đã được đăng ký');
    err.status = 409;
    throw err;
  }
  const hashed = hashPassword(password);
  let user;
  try {
    user = userRepository.create({
      name: cleanName,
      email: normalizedEmail,
      password: hashed,
      role: 'user',
    });
  } catch (e) {
    // Race-safe: in case UNIQUE(email) index is hit
    if (String(e?.message || '').includes('UNIQUE') || e?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const err = new Error('Email đã được đăng ký');
      err.status = 409;
      throw err;
    }
    throw e;
  }
  walletRepository.create({ userId: user.id, name: 'Ví chính', balance: 0 });
  walletRepository.create({ userId: user.id, name: 'Ví tiền mặt', balance: 0 });
  const db = getDb();
  ensurePresetCategoriesForUser(db, user.id);
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return { user: sanitize(user), token };
}

export function getMe(userId) {
  const user = userRepository.findById(userId);
  if (!user || user.isDeleted) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { user: sanitize(user) };
}

export function updateProfile(userId, { name, email, avatar }) {
  const user = userRepository.findById(userId);
  if (!user || user.isDeleted) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  if (email && email !== user.email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = userRepository.findByEmail(normalizedEmail);
    if (existing && existing.id !== userId) {
      const err = new Error('Email đã được sử dụng');
      err.status = 409;
      throw err;
    }
  }
  
  const updated = userRepository.update(userId, { 
    name: name || user.name, 
    email: email ? String(email).trim().toLowerCase() : user.email,
    avatar: avatar || user.avatar 
  });
  return { user: sanitize(updated) };
}

export function changePassword(userId, { currentPassword, newPassword }) {
  const user = userRepository.findById(userId);
  if (!user || user.isDeleted) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  
  if (!currentPassword || !newPassword) {
    const err = new Error('Vui lòng nhập đầy đủ mật khẩu');
    err.status = 400;
    throw err;
  }
  
  if (!user.password) {
    const err = new Error('Tài khoản chưa có mật khẩu');
    err.status = 400;
    throw err;
  }
  
  if (!comparePassword(currentPassword, user.password)) {
    const err = new Error('Mật khẩu hiện tại không đúng');
    err.status = 401;
    throw err;
  }
  
  const hashed = hashPassword(newPassword);
  userRepository.update(userId, { password: hashed });
  return { message: 'Đổi mật khẩu thành công' };
}

export function login({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = userRepository.findByEmail(normalizedEmail);
  if (!user || !comparePassword(password, user.password)) {
    const err = new Error('Sai email hoặc mật khẩu');
    err.status = 401;
    throw err;
  }
  if (user.twoFactorEnabled) {
    const twoFactorToken = signToken(
      { sub: user.id, purpose: '2fa', email: user.email, role: user.role },
      { expiresIn: '5m' }
    );
    return { requires2fa: true, twoFactorToken, user: sanitize(user) };
  }

  return issueLogin(user);
}

export function forgotPassword({ email }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = userRepository.findByEmail(normalizedEmail);

  // Always respond 200 to avoid email enumeration
  if (!user) return { ok: true };

  const token = randomToken(32);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  passwordResetRepository.createReset({ userId: user.id, tokenHash, expiresAt });

  // Production should email the token link; in dev we return the token for convenience
  if (config.nodeEnv !== 'production') {
    return { ok: true, devResetToken: token, expiresAt };
  }
  return { ok: true };
}

export function resetPassword({ token, newPassword }) {
  const tokenHash = sha256Hex(String(token).trim());
  const row = passwordResetRepository.findValidByTokenHash(tokenHash);
  if (!row) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }
  const hashed = hashPassword(newPassword);
  userRepository.update(row.userId, { password: hashed });
  passwordResetRepository.markUsed(row.id);
  passwordResetRepository.invalidateAllForUser(row.userId);
  return { ok: true };
}

export function twoFactorSetup(userId) {
  const user = userRepository.findById(userId);
  if (!user || user.isDeleted) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `QLyChiTieu (${user.email})`,
  });
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  userRepository.updateTwoFactor(userId, {
    twoFactorTempSecretEnc: encryptText(secret.base32),
    twoFactorTempExpiresAt: expiresAt,
  });
  return {
    ok: true,
    otpauthUrl: secret.otpauth_url,
    secretBase32: secret.base32,
    expiresAt,
  };
}

export function twoFactorEnable(userId, { code }) {
  const user = userRepository.findById(userId);
  if (!user || user.isDeleted) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!user.twoFactorTempSecretEnc || !user.twoFactorTempExpiresAt) {
    const err = new Error('2FA setup not initiated');
    err.status = 400;
    throw err;
  }
  if (new Date(user.twoFactorTempExpiresAt).getTime() <= Date.now()) {
    userRepository.updateTwoFactor(userId, {
      twoFactorTempSecretEnc: null,
      twoFactorTempExpiresAt: null,
    });
    const err = new Error('2FA setup expired. Please setup again');
    err.status = 400;
    throw err;
  }
  const base32 = decryptText(user.twoFactorTempSecretEnc);
  const ok = speakeasy.totp.verify({
    secret: base32,
    encoding: 'base32',
    token: String(code).trim(),
    window: 1,
  });
  if (!ok) {
    const err = new Error('Mã 2FA không đúng');
    err.status = 400;
    throw err;
  }

  const backupCodes = generateBackupCodes(10);
  const backupHashes = backupCodes.map((c) => sha256Hex(c));
  backupCodeRepository.replaceAllForUser(userId, backupHashes);

  userRepository.updateTwoFactor(userId, {
    twoFactorEnabled: 1,
    twoFactorSecretEnc: encryptText(base32),
    twoFactorTempSecretEnc: null,
    twoFactorTempExpiresAt: null,
  });

  return { ok: true, backupCodes };
}

export function twoFactorDisable(userId, { password, code, backupCode }) {
  const user = userRepository.findById(userId);
  if (!user || user.isDeleted) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!comparePassword(password, user.password)) {
    const err = new Error('Mật khẩu không đúng');
    err.status = 401;
    throw err;
  }
  if (!user.twoFactorEnabled) {
    return { ok: true };
  }
  const ok = verifySecondFactor(user, {
    code: String(code || '').trim(),
    backupCode: String(backupCode || '').trim(),
  });
  if (!ok) {
    const err = new Error('Mã 2FA/backup code không đúng');
    err.status = 401;
    throw err;
  }
  userRepository.updateTwoFactor(userId, {
    twoFactorEnabled: 0,
    twoFactorSecretEnc: null,
    twoFactorTempSecretEnc: null,
    twoFactorTempExpiresAt: null,
  });
  backupCodeRepository.clearAll(userId);
  return { ok: true };
}

export function twoFactorLoginVerify({ twoFactorToken, code, backupCode }) {
  // Keep service self-contained: verify JWT purpose by decoding via verifyToken would be better,
  // but we reuse authMiddleware's verify elsewhere; here we validate minimal with jsonwebtoken.
  // We'll use signToken/verifyToken in a small local import to avoid circular dependencies.
  // eslint-disable-next-line no-use-before-define
  const decoded = verifyPurposeToken(twoFactorToken, '2fa');
  const user = userRepository.findById(decoded.sub);
  if (!user || user.isDeleted) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  if (!user.twoFactorEnabled) {
    const err = new Error('2FA not enabled');
    err.status = 400;
    throw err;
  }
  const ok = verifySecondFactor(user, {
    code: String(code || '').trim(),
    backupCode: String(backupCode || '').trim(),
  });
  if (!ok) {
    const err = new Error('Mã 2FA/backup code không đúng');
    err.status = 401;
    throw err;
  }
  return issueLogin(user);
}

function sanitize(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function issueLogin(user) {
  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return { user: sanitize(user), token };
}

function verifySecondFactor(user, { code, backupCode }) {
  const providedBackup = String(backupCode || '').trim();
  if (providedBackup) {
    const consumed = backupCodeRepository.consumeIfValid(user.id, sha256Hex(providedBackup));
    return consumed;
  }
  const providedTotp = String(code || '').trim();
  if (!providedTotp) return false;
  if (!user.twoFactorSecretEnc) return false;
  const base32 = decryptText(user.twoFactorSecretEnc);
  return speakeasy.totp.verify({
    secret: base32,
    encoding: 'base32',
    token: providedTotp,
    window: 1,
  });
}

function generateBackupCodes(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // 10 chars, human-friendly-ish
    out.push(randomToken(8).slice(0, 10).toUpperCase());
  }
  return out;
}

function verifyPurposeToken(token, purpose) {
  const decoded = verifyToken(token);
  if (!decoded || decoded.purpose !== purpose) {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    throw err;
  }
  return decoded;
}
