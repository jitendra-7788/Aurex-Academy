import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { AppError } from '../utils/AppError.js';

export function countCourseLessons(course) {
  return (course.sections || []).reduce((sum, s) => sum + (s.lessons?.length || 0), 0);
}

export async function ensureEnrollment(studentId, courseId) {
  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment || enrollment.status === 'cancelled' || enrollment.status === 'refunded') {
    throw new AppError('Enrollment required', 403);
  }
  return enrollment;
}

export async function enrollFree(studentId, courseId) {
  const course = await Course.findById(courseId);
  if (!course || course.status !== 'published') {
    throw new AppError('Course not available', 404);
  }
  if (!course.isFree) {
    throw new AppError('This course requires payment', 400);
  }

  let enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (enrollment && enrollment.status === 'active') {
    return enrollment;
  }

  if (enrollment) {
    enrollment.status = 'active';
    enrollment.enrolledAt = new Date();
    await enrollment.save();
  } else {
    enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: 'active',
    });
    course.enrollmentCount += 1;
    await course.save();
  }
  return enrollment;
}

export async function enrollAfterPayment({ studentId, courseId, paymentId }) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);

  let enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (enrollment && enrollment.status === 'active') {
    return enrollment;
  }

  if (enrollment) {
    enrollment.status = 'active';
    enrollment.payment = paymentId;
    enrollment.enrolledAt = new Date();
    await enrollment.save();
  } else {
    enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      payment: paymentId,
      status: 'active',
    });
    course.enrollmentCount += 1;
    await course.save();
  }
  return enrollment;
}

export async function recalculateProgress(studentId, courseId) {
  const course = await Course.findById(courseId);
  if (!course) return null;

  const totalLessons = countCourseLessons(course);
  const completed = await LessonProgress.countDocuments({
    student: studentId,
    course: courseId,
    completed: true,
  });

  const percent = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment) return null;

  enrollment.progressPercent = percent;
  enrollment.completedLessons = (
    await LessonProgress.find({ student: studentId, course: courseId, completed: true }).select('lesson')
  ).map((p) => p.lesson);

  if (percent >= 100 && enrollment.status === 'active') {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
  }

  await enrollment.save();
  return enrollment;
}

export async function isCourseComplete(studentId, courseId) {
  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment) return false;
  if (enrollment.progressPercent >= 100) return true;

  const course = await Course.findById(courseId);
  const total = countCourseLessons(course);
  if (total === 0) return false;
  const completed = await LessonProgress.countDocuments({
    student: studentId,
    course: courseId,
    completed: true,
  });
  return completed >= total;
}

export async function getStudentProgressSummary(studentId, courseId) {
  const enrollment = await ensureEnrollment(studentId, courseId);
  const course = await Course.findById(courseId).populate('instructor', 'name');
  const progresses = await LessonProgress.find({ student: studentId, course: courseId });
  const quizAttempts = await QuizAttempt.find({ student: studentId, course: courseId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('quiz', 'title');

  return {
    enrollment,
    course,
    lessonProgress: progresses,
    recentQuizAttempts: quizAttempts,
  };
}
