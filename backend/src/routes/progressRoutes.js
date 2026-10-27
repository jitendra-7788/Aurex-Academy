import { Router } from 'express';
import {
  markLessonProgress,
  getCourseProgress,
  getStudentDashboard,
} from '../controllers/progressController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/dashboard', authorize('student', 'admin'), getStudentDashboard);
router.get('/course/:courseId', getCourseProgress);
router.post('/course/:courseId/lessons/:lessonId', markLessonProgress);

export default router;
