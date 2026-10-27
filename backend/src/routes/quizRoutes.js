import { Router } from 'express';
import {
  createQuiz,
  updateQuiz,
  listCourseQuizzes,
  getQuizForAttempt,
  submitQuiz,
  getMyAttempts,
  getQuizResultsForInstructor,
} from '../controllers/quizController.js';
import { protect, authorize, requireApprovedInstructor } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', authorize('instructor', 'admin'), requireApprovedInstructor, createQuiz);
router.patch('/:id', authorize('instructor', 'admin'), requireApprovedInstructor, updateQuiz);
router.get('/course/:courseId', listCourseQuizzes);
router.get('/:id/attempt', authorize('student', 'admin'), getQuizForAttempt);
router.post('/:id/submit', authorize('student', 'admin'), submitQuiz);
router.get('/attempts/mine', getMyAttempts);
router.get('/:id/results', authorize('instructor', 'admin'), getQuizResultsForInstructor);

export default router;
