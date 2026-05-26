import { verifyToken } from '../utils/jwt.js';
import * as userRepository from '../repositories/userRepository.js';
import { ensureMonthlyRollover } from '../services/historyService.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
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
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
