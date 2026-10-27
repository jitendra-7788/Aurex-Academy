import { Router } from 'express';
import {
  getAdminOverview,
  listUsers,
  updateUserStatus,
  approveInstructor,
  moderateCourse,
  listAllCourses,
  listEnrollments,
  listPayments,
  listLiveClasses,
  listCertificates,
  listQuizzes,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/users', listUsers);
router.patch('/users/:id', updateUserStatus);
router.post('/users/:id/approve-instructor', approveInstructor);
router.get('/courses', listAllCourses);
router.patch('/courses/:id/status', moderateCourse);
router.get('/enrollments', listEnrollments);
router.get('/payments', listPayments);
router.get('/live-classes', listLiveClasses);
router.get('/certificates', listCertificates);
router.get('/quizzes', listQuizzes);

export default router;
