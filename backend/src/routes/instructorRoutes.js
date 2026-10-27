import { Router } from 'express';
import {
  getInstructorDashboard,
  getInstructorRevenue,
  getCourseStudentProgress,
} from '../controllers/instructorController.js';
import { protect, authorize, requireApprovedInstructor } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('instructor', 'admin'), requireApprovedInstructor);

router.get('/dashboard', getInstructorDashboard);
router.get('/revenue', getInstructorRevenue);
router.get('/courses/:courseId/students', getCourseStudentProgress);

export default router;
