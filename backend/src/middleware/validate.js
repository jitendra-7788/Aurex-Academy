import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
};
