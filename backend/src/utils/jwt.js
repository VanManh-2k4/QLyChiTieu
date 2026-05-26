import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function signToken(payload, options = {}) {
  const { expiresIn = '7d' } = options;
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
