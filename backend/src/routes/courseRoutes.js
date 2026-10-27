import { Router } from 'express';
import {
  createCourse,
  updateCourse,
  publishCourse,
  listCourses,
  getCourseBySlug,
  getInstructorCourses,
  addSection,
  updateSection,
  deleteSection,
  addLesson,
  updateLesson,
  deleteLesson,
  uploadLessonVideo,
  getLessonPlayback,
  enrollInCourse,
  getCourseForLearning,
  uploadCourseThumbnail,
  reorderSections,
} from '../controllers/courseController.js';

import { protect, authorize, requireApprovedInstructor } from '../middleware/auth.js';
import { uploadVideo, uploadThumbnail } from '../middleware/upload.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

router.get('/', listCourses);
router.get('/slug/:slug', optionalAuth, getCourseBySlug);

router.use(protect);

router.get('/instructor/mine', authorize('instructor', 'admin'), getInstructorCourses);
router.post('/', authorize('instructor', 'admin'), requireApprovedInstructor, createCourse);
router.patch('/:id', authorize('instructor', 'admin'), requireApprovedInstructor, updateCourse);
router.post('/:id/publish', authorize('instructor', 'admin'), requireApprovedInstructor, publishCourse);
router.post('/:id/thumbnail', authorize('instructor', 'admin'), requireApprovedInstructor, uploadThumbnail, uploadCourseThumbnail);
router.post('/:id/sections', authorize('instructor', 'admin'), requireApprovedInstructor, addSection);
router.patch('/:id/sections/reorder', authorize('instructor', 'admin'), requireApprovedInstructor, reorderSections);
router.patch('/:id/sections/:sectionId', authorize('instructor', 'admin'), requireApprovedInstructor, updateSection);
router.delete('/:id/sections/:sectionId', authorize('instructor', 'admin'), requireApprovedInstructor, deleteSection);
router.post('/:id/sections/:sectionId/lessons', authorize('instructor', 'admin'), requireApprovedInstructor, addLesson);
router.patch('/:id/lessons/:lessonId', authorize('instructor', 'admin'), requireApprovedInstructor, updateLesson);
router.delete('/:id/lessons/:lessonId', authorize('instructor', 'admin'), requireApprovedInstructor, deleteLesson);
router.post(
  '/:id/lessons/:lessonId/video',
  authorize('instructor', 'admin'),
  requireApprovedInstructor,
  uploadVideo,
  uploadLessonVideo
);
router.get('/:id/learning', getCourseForLearning);
router.get('/:id/lessons/:lessonId/playback', getLessonPlayback);
router.post('/:id/enroll', authorize('student', 'admin'), enrollInCourse);


export default router;
