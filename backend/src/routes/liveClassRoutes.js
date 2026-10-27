import { Router } from 'express';
import {
  scheduleLiveClass,
  updateLiveClass,
  startLiveClass,
  endLiveClass,
  listCourseLiveClasses,
  listMyLiveClasses,
  getJoinInfo,
} from '../controllers/liveClassController.js';
import { protect, authorize, requireApprovedInstructor } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/mine', listMyLiveClasses);
router.get('/course/:courseId', listCourseLiveClasses);
router.post('/', authorize('instructor', 'admin'), requireApprovedInstructor, scheduleLiveClass);
router.patch('/:id', authorize('instructor', 'admin'), requireApprovedInstructor, updateLiveClass);
router.post('/:id/start', authorize('instructor', 'admin'), requireApprovedInstructor, startLiveClass);
router.post('/:id/end', authorize('instructor', 'admin'), requireApprovedInstructor, endLiveClass);
router.get('/:id/join', getJoinInfo);

export default router;
