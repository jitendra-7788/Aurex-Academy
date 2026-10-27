import { LessonProgress } from '../models/LessonProgress.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { LiveClass } from '../models/LiveClass.js';
import { Quiz } from '../models/Quiz.js';
import { Certificate } from '../models/Certificate.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import {
  ensureEnrollment,
  recalculateProgress,
} from '../services/enrollmentService.js';

export const markLessonProgress = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { watchedSeconds = 0, completed = false } = req.body;

  await ensureEnrollment(req.user._id, courseId);
  const course = await Course.findById(courseId);
  if (!course?.findLesson(lessonId)) throw new AppError('Lesson not found', 404);

  let progress = await LessonProgress.findOne({
    student: req.user._id,
    course: courseId,
    lesson: lessonId,
  });

  if (!progress) {
    progress = new LessonProgress({
      student: req.user._id,
      course: courseId,
      lesson: lessonId,
    });
  }

  progress.watchedSeconds = Math.max(progress.watchedSeconds, Number(watchedSeconds) || 0);
  progress.lastWatchedAt = new Date();
  if (completed && !progress.completed) {
    progress.completed = true;
    progress.completedAt = new Date();
  }
  await progress.save();

  const enrollment = await recalculateProgress(req.user._id, courseId);
  sendSuccess(res, { progress, enrollment }, 'Progress updated');
});

export const getCourseProgress = asyncHandler(async (req, res) => {
  await ensureEnrollment(req.user._id, req.params.courseId);
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  const lessonProgress = await LessonProgress.find({
    student: req.user._id,
    course: req.params.courseId,
  });
  sendSuccess(res, { enrollment, lessonProgress });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user._id,
    status: { $in: ['active', 'completed'] },
  })
    .populate({
      path: 'course',
      populate: { path: 'instructor', select: 'name' },
    })
    .sort({ updatedAt: -1 });

  const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);

  const [upcomingClasses, publishedQuizzes, recentQuizzes, certificates] = await Promise.all([
    LiveClass.find({
      course: { $in: courseIds },
      status: { $in: ['scheduled', 'live'] },
      scheduledStart: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    })
      .sort({ scheduledStart: 1 })
      .limit(5)
      .populate('course', 'title slug'),
    Quiz.find({
      course: { $in: courseIds },
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('course', 'title slug'),
    QuizAttempt.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('quiz', 'title passingScore')
      .populate('course', 'title slug'),
    Certificate.find({ student: req.user._id })
      .sort({ issuedAt: -1 })
      .limit(5)
      .populate('course', 'title slug'),
  ]);

  const continueLearning = enrollments
    .filter((e) => e.status === 'active' && e.progressPercent < 100)
    .slice(0, 6);

  sendSuccess(res, {
    enrollments,
    continueLearning,
    upcomingClasses,
    publishedQuizzes: publishedQuizzes.map((quiz) => quiz.toStudentView()),
    recentQuizzes,
    certificates,
  });
});
