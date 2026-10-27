import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Payment } from '../models/Payment.js';
import { LiveClass } from '../models/LiveClass.js';
import { Certificate } from '../models/Certificate.js';
import { Quiz } from '../models/Quiz.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [
    users,
    students,
    instructors,
    pendingInstructors,
    courses,
    publishedCourses,
    enrollments,
    payments,
    liveClasses,
    certificates,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor', instructorApproved: true }),
    User.countDocuments({ role: 'instructor', instructorApproved: false }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'published' }),
    Enrollment.countDocuments({ status: { $in: ['active', 'completed'] } }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    LiveClass.countDocuments(),
    Certificate.countDocuments(),
  ]);

  sendSuccess(res, {
    users: { total: users, students, instructors, pendingInstructors },
    courses: { total: courses, published: publishedCourses },
    enrollments,
    payments: {
      count: payments[0]?.count || 0,
      gross: Math.round((payments[0]?.total || 0) * 100) / 100,
    },
    liveClasses,
    certificates,
  });
});

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.$or = [
      { name: { $regex: req.query.q, $options: 'i' } },
      { email: { $regex: req.query.q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshTokenHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  sendPaginated(res, {
    items: items.map((u) => u.toSafeJSON()),
    page,
    limit,
    total,
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin' && req.user._id.toString() === user._id.toString()) {
    throw new AppError('Cannot change own admin status this way', 400);
  }

  if (req.body.status) user.status = req.body.status;
  if (req.body.instructorApproved !== undefined) {
    user.instructorApproved = Boolean(req.body.instructorApproved);
    if (user.instructorApproved && user.status === 'pending') {
      user.status = 'active';
    }
  }
  await user.save();
  sendSuccess(res, { user: user.toSafeJSON() }, 'User updated');
});

export const approveInstructor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'instructor') throw new AppError('Instructor not found', 404);
  user.instructorApproved = true;
  user.status = 'active';
  await user.save();
  sendSuccess(res, { user: user.toSafeJSON() }, 'Instructor approved');
});

export const moderateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  const { status } = req.body;
  if (!['draft', 'pending_review', 'published', 'archived'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }
  course.status = status;
  if (status === 'published') course.publishedAt = new Date();
  await course.save();
  sendSuccess(res, { course }, 'Course status updated');
});

export const listAllCourses = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Course.countDocuments(filter),
  ]);
  sendPaginated(res, { items, page, limit, total });
});

export const listEnrollments = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const [items, total] = await Promise.all([
    Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Enrollment.countDocuments(),
  ]);
  sendPaginated(res, { items, page, limit, total });
});

export const listPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('student', 'name email')
    .populate('course', 'title')
    .populate('instructor', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  sendSuccess(res, { payments });
});

export const listLiveClasses = asyncHandler(async (req, res) => {
  const liveClasses = await LiveClass.find()
    .populate('course', 'title')
    .populate('instructor', 'name')
    .sort({ scheduledStart: -1 })
    .limit(100);
  sendSuccess(res, { liveClasses });
});

export const listCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find()
    .populate('student', 'name email')
    .populate('course', 'title')
    .sort({ issuedAt: -1 })
    .limit(100);
  sendSuccess(res, { certificates });
});

export const listQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find()
    .populate('course', 'title')
    .populate('instructor', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  sendSuccess(res, { quizzes });
});
