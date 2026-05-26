import { verifyToken } from '../utils/jwt.js';
import * as userRepository from '../repositories/userRepository.js';
import { getDb } from '../database/db.js';
import { ensureMonthlyRollover } from '../services/historyService.js';

function attachDefaultUser(req) {
  const db = getDb();
  const user = db
    .prepare(
      `SELECT id, name, email, role
       FROM users
       WHERE isDeleted = 0
       ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id ASC
       LIMIT 1`
    )
    .get();
  if (!user) {
    return false;
  }
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return true;
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    if (attachDefaultUser(req)) {
      ensureMonthlyRollover(req.user.id);
      return next();
    }
    return res.status(401).json({ message: 'No active user found' });
  }
  const token = header.slice(7);
  try {
    const decoded = verifyToken(token);
    const user = userRepository.findById(decoded.sub);
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    ensureMonthlyRollover(req.user.id);
    next();
  } catch {
    if (attachDefaultUser(req)) {
      ensureMonthlyRollover(req.user.id);
      return next();
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
