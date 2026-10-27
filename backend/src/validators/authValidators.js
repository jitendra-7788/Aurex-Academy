import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must include a letter')
    .matches(/[0-9]/)
    .withMessage('Password must include a number'),
  body('role').optional().isIn(['student', 'instructor']),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 120 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('headline').optional().isLength({ max: 160 }),
  body('avatar').optional().isString(),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must include a letter')
    .matches(/[0-9]/)
    .withMessage('Password must include a number'),
];
