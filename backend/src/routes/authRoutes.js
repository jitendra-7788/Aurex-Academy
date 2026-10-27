import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} from '../validators/authValidators.js';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, try again later' },
});

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, me);
router.patch('/profile', protect, updateProfileValidator, validate, updateProfile);
router.post('/change-password', protect, changePasswordValidator, validate, changePassword);

export default router;
