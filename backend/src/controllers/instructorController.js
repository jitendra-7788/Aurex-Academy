import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Payment } from '../models/Payment.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { LiveClass } from '../models/LiveClass.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/AppError.js';

export const getInstructorDashboard = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const courses = await Course.find({ instructor: instructorId });
  const courseIds = courses.map((c) => c._id);

  const [enrollmentCount, payments, upcomingClasses] = await Promise.all([
    Enrollment.countDocuments({ course: { $in: courseIds }, status: { $in: ['active', 'completed'] } }),
    Payment.find({ instructor: instructorId, status: 'completed' }).sort({ createdAt: -1 }),
    LiveClass.find({
      instructor: instructorId,
      status: { $in: ['scheduled', 'live'] },
    })
      .sort({ scheduledStart: 1 })
      .limit(5)
      .populate('course', 'title'),
  ]);

  const gross = payments.reduce((s, p) => s + p.amount, 0);
  const refunds = payments.reduce((s, p) => s + (p.refundAmount || 0), 0);
  const platformFees = payments.reduce((s, p) => s + p.platformFee, 0);
  const estimatedEarnings = payments.reduce((s, p) => s + p.instructorEarning, 0);

  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const count = await Enrollment.countDocuments({
        course: course._id,
        status: { $in: ['active', 'completed'] },
      });
      return {
        courseId: course._id,
        title: course.title,
        status: course.status,
        enrollments: count,
        price: course.price,
      };
    })
  );

  sendSuccess(res, {
    totals: {
      courses: courses.length,
      enrollments: enrollmentCount,
      grossPayments: Math.round(gross * 100) / 100,
      refunds: Math.round(refunds * 100) / 100,
      platformFees: Math.round(platformFees * 100) / 100,
      estimatedEarnings: Math.round(estimatedEarnings * 100) / 100,
      payoutStatus: 'estimated',
    },
    courseStats,
    recentTransactions: payments.slice(0, 10),
    upcomingClasses,
  });
});

export const getInstructorRevenue = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const payments = await Payment.find({
    instructor: req.user._id,
    status: { $in: ['completed', 'refunded'] },
    createdAt: { $gte: from, $lte: to },
  })
    .populate('course', 'title')
    .populate('student', 'name email')
    .sort({ createdAt: -1 });

  const summary = {
    gross: 0,
    refunds: 0,
    platformFees: 0,
    estimatedEarnings: 0,
  };

  for (const p of payments) {
    summary.gross += p.amount;
    summary.refunds += p.refundAmount || 0;
    summary.platformFees += p.platformFee;
    summary.estimatedEarnings += p.instructorEarning;
  }

  Object.keys(summary).forEach((k) => {
    summary[k] = Math.round(summary[k] * 100) / 100;
  });
  summary.payoutStatus = 'estimated — automatic payouts not implemented';

  sendSuccess(res, { summary, transactions: payments });
});

export const getCourseStudentProgress = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  const enrollments = await Enrollment.find({
    course: course._id,
    status: { $in: ['active', 'completed'] },
  })
    .populate('student', 'name email')
    .sort({ progressPercent: -1 });

  const quizStats = await QuizAttempt.aggregate([
    { $match: { course: course._id } },
    {
      $group: {
        _id: '$student',
        attempts: { $sum: 1 },
        avgPercentage: { $avg: '$percentage' },
        passed: { $sum: { $cond: ['$passed', 1, 0] } },
      },
    },
  ]);

  sendSuccess(res, { enrollments, quizStats });
});
