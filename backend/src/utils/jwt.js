import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function signToken(payload, options = {}) {
  // SECURITY: Reduced from 7d to 1d for better security
  // Shorter expiration reduces the window for token theft
  const { expiresIn = '1d' } = options;
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
