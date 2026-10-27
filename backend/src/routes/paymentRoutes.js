import { Router } from 'express';
import {
  createCheckoutSession,
  confirmSession,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/checkout/:courseId', authorize('student', 'admin'), createCheckoutSession);
router.get('/confirm/:sessionId', authorize('student', 'admin'), confirmSession);

export default router;
