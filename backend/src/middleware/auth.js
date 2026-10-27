import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  const decoded = jwt.verify(token, env.jwt.accessSecret);
  const user = await User.findById(decoded.sub);

  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  if (user.status === 'suspended') {
    throw new AppError('Account suspended', 403);
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };

export const requireApprovedInstructor = (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'instructor' || !req.user.instructorApproved) {
    return next(new AppError('Instructor approval required', 403));
  }
  if (req.user.status === 'pending') {
    return next(new AppError('Instructor account pending approval', 403));
  }
  next();
};
