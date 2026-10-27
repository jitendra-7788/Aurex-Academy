import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((e) => e.message);
  }

  if (err.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(err.keyPattern || {});
    message = `Duplicate value for: ${fields.join(', ') || 'field'}`;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path || 'id'}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}
