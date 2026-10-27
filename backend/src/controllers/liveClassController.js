import { v4 as uuidv4 } from 'uuid';
import { LiveClass } from '../models/LiveClass.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

function assertOwner(liveClass, user) {
  if (user.role === 'admin') return;
  if (liveClass.instructor.toString() !== user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }
}

export const scheduleLiveClass = asyncHandler(async (req, res) => {
  if (!req.body.courseId) throw new AppError('Course ID is required', 400);
  const course = await Course.findById(req.body.courseId).catch(() => null);
  if (!course) throw new AppError('Course not found', 404);
  if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  const liveClass = await LiveClass.create({
    title: req.body.title,
    description: req.body.description || '',
    course: course._id,
    instructor: course.instructor,
    scheduledStart: new Date(req.body.scheduledStart),
    durationMinutes: Number(req.body.durationMinutes) || 60,
    timezone: req.body.timezone || 'UTC',
    roomId: `room-${uuidv4()}`,
  });

  sendSuccess(res, { liveClass }, 'Live class scheduled', 201);
});

export const updateLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) throw new AppError('Live class not found', 404);
  assertOwner(liveClass, req.user);

  ['title', 'description', 'scheduledStart', 'durationMinutes', 'timezone'].forEach((f) => {
    if (req.body[f] !== undefined) {
      liveClass[f] = f === 'scheduledStart' ? new Date(req.body[f]) : req.body[f];
    }
  });
  await liveClass.save();
  sendSuccess(res, { liveClass }, 'Live class updated');
});

export const startLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) throw new AppError('Live class not found', 404);
  assertOwner(liveClass, req.user);
  if (liveClass.status === 'ended' || liveClass.status === 'cancelled') {
    throw new AppError('Cannot start this session', 400);
  }
  liveClass.status = 'live';
  liveClass.startedAt = new Date();
  await liveClass.save();
  sendSuccess(res, { liveClass }, 'Live class started');
});

export const endLiveClass = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id);
  if (!liveClass) throw new AppError('Live class not found', 404);
  assertOwner(liveClass, req.user);
  liveClass.status = 'ended';
  liveClass.endedAt = new Date();
  await liveClass.save();
  sendSuccess(res, { liveClass }, 'Live class ended');
});

export const listCourseLiveClasses = asyncHandler(async (req, res) => {
  const classes = await LiveClass.find({ course: req.params.courseId })
    .sort({ scheduledStart: 1 })
    .populate('instructor', 'name');
  sendSuccess(res, { liveClasses: classes });
});

export const listMyLiveClasses = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'instructor') {
    filter = { instructor: req.user._id };
  } else if (req.user.role === 'student') {
    const enrollments = await Enrollment.find({
      student: req.user._id,
      status: { $in: ['active', 'completed'] },
    }).select('course');
    filter = { course: { $in: enrollments.map((e) => e.course) } };
  }

  const liveClasses = await LiveClass.find(filter)
    .sort({ scheduledStart: 1 })
    .populate('course', 'title slug')
    .populate('instructor', 'name');
  sendSuccess(res, { liveClasses });
});

export const getJoinInfo = asyncHandler(async (req, res) => {
  const liveClass = await LiveClass.findById(req.params.id)
    .populate('course', 'title')
    .populate('instructor', 'name');
  if (!liveClass) throw new AppError('Live class not found', 404);

  const isInstructor =
    req.user.role === 'admin' ||
    liveClass.instructor._id.toString() === req.user._id.toString();

  if (!isInstructor) {
    const enrolled = await Enrollment.findOne({
      student: req.user._id,
      course: liveClass.course._id,
      status: { $in: ['active', 'completed'] },
    });
    if (!enrolled) throw new AppError('Enrollment required to join', 403);
  }

  if (!['scheduled', 'live'].includes(liveClass.status)) {
    throw new AppError('This live class is not joinable', 400);
  }

  const iceServers = [
    ...env.webrtc.stunUrls.map((url) => ({ urls: url })),
  ];
  if (env.webrtc.turnUrls.length) {
    iceServers.push({
      urls: env.webrtc.turnUrls,
      username: env.webrtc.turnUsername || undefined,
      credential: env.webrtc.turnCredential || undefined,
    });
  }

  sendSuccess(res, {
    liveClass,
    roomId: liveClass.roomId,
    role: isInstructor ? 'instructor' : 'student',
    iceServers,
  });
});
