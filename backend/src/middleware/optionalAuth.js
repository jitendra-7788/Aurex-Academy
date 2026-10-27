import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.sub);
    if (user && user.status !== 'suspended') req.user = user;
  } catch {
    /* ignore invalid token for optional auth */
  }
  next();
}
