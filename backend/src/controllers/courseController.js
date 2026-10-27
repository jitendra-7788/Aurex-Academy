import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/apiResponse.js';
import { getStorage } from '../services/storage/index.js';
import { enqueueVideoProcessing } from '../jobs/videoQueue.js';
import { getVideoDeliveryUrl, getDeliveryMode } from '../services/videoDelivery.js';
import { ensureEnrollment, enrollFree } from '../services/enrollmentService.js';
import { storageRoot } from '../config/env.js';

function assertCourseOwner(course, user) {
  if (user.role === 'admin') return;
  if (course.instructor.toString() !== user._id.toString()) {
    throw new AppError('Not authorized to modify this course', 403);
  }
}

export const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    shortDescription,
    description,
    category,
    level,
    price = 0,
    learningObjectives = [],
    prerequisites = [],
  } = req.body;

  const course = await Course.create({
    title,
    shortDescription,
    description,
    category,
    level,
    price: Number(price) || 0,
    learningObjectives,
    prerequisites,
    instructor: req.user._id,
    status: 'draft',
  });

  sendSuccess(res, { course }, 'Course created', 201);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);

  const fields = [
    'title',
    'shortDescription',
    'description',
    'category',
    'level',
    'price',
    'learningObjectives',
    'prerequisites',
    'thumbnail',
  ];
  for (const field of fields) {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  }
  if (req.body.price !== undefined) {
    course.price = Number(req.body.price) || 0;
  }
  await course.save();
  sendSuccess(res, { course }, 'Course updated');
});

export const publishCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);

  if (!course.sections?.length || !course.sections.some((s) => s.lessons?.length)) {
    throw new AppError('Add at least one lesson before publishing', 400);
  }

  course.status = req.user.role === 'admin' ? 'published' : 'pending_review';
  if (course.status === 'published') course.publishedAt = new Date();
  await course.save();
  sendSuccess(
    res,
    { course },
    course.status === 'published' ? 'Course published' : 'Course submitted for review'
  );
});

export const listCourses = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const filter = { status: 'published' };

  if (req.query.category) {
    filter.category = { $regex: new RegExp(`^${req.query.category.trim()}$`, 'i') };
  }
  if (req.query.level) {
    filter.level = req.query.level.toLowerCase().trim();
  }
  if (req.query.instructor) filter.instructor = req.query.instructor;
  if (req.query.price === 'free') filter.isFree = true;
  if (req.query.price === 'paid') filter.isFree = false;
  if (req.query.q && req.query.q.trim()) {
    const qRegex = { $regex: req.query.q.trim(), $options: 'i' };
    filter.$or = [
      { title: qRegex },
      { shortDescription: qRegex },
      { description: qRegex },
      { category: qRegex },
    ];
  }

  const [items, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name headline avatar')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  sendPaginated(res, { items, page, limit, total });
});

export const getCourseBySlug = asyncHandler(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug }).populate(
    'instructor',
    'name headline bio avatar'
  );
  if (!course || (course.status !== 'published' && (!req.user || (req.user.role !== 'admin' && course.instructor._id.toString() !== req.user._id.toString())))) {
    throw new AppError('Course not found', 404);
  }

  let enrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
      status: { $in: ['active', 'completed'] },
    });
    enrolled = Boolean(enrollment);
  }

  const safeCourse = course.toObject();
  if (!enrolled && req.user?.role !== 'admin' && course.instructor._id.toString() !== req.user?._id?.toString()) {
    safeCourse.sections = safeCourse.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
        durationSeconds: lesson.durationSeconds,
        isFreePreview: lesson.isFreePreview,
        video: { status: lesson.video?.status || 'none' },
      })),
    }));
  }

  sendSuccess(res, { course: safeCourse, enrolled });
});

export const getInstructorCourses = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { instructor: req.user._id };
  const courses = await Course.find(filter).sort({ updatedAt: -1 });
  sendSuccess(res, { courses });
});

export const addSection = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);

  const order = course.sections.length;
  course.sections.push({ title: req.body.title, order, lessons: [] });
  await course.save();
  sendSuccess(res, { course }, 'Section added', 201);
});

export const updateSection = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const section = course.sections.id(req.params.sectionId);
  if (!section) throw new AppError('Section not found', 404);
  if (req.body.title !== undefined) section.title = req.body.title;
  if (req.body.order !== undefined) section.order = req.body.order;
  await course.save();
  sendSuccess(res, { course }, 'Section updated');
});

export const deleteSection = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const section = course.sections.id(req.params.sectionId);
  if (!section) throw new AppError('Section not found', 404);
  section.deleteOne();
  await course.save();
  sendSuccess(res, { course }, 'Section deleted');
});

export const addLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const section = course.sections.id(req.params.sectionId);
  if (!section) throw new AppError('Section not found', 404);

  section.lessons.push({
    title: req.body.title,
    description: req.body.description || '',
    order: section.lessons.length,
    isFreePreview: Boolean(req.body.isFreePreview),
    video: { status: 'none' },
  });
  course.recalculateDuration();
  await course.save();
  sendSuccess(res, { course }, 'Lesson added', 201);
});

export const updateLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const found = course.findLesson(req.params.lessonId);
  if (!found) throw new AppError('Lesson not found', 404);
  const { lesson } = found;
  ['title', 'description', 'order', 'isFreePreview', 'durationSeconds'].forEach((f) => {
    if (req.body[f] !== undefined) lesson[f] = req.body[f];
  });
  course.recalculateDuration();
  await course.save();
  sendSuccess(res, { course }, 'Lesson updated');
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const found = course.findLesson(req.params.lessonId);
  if (!found) throw new AppError('Lesson not found', 404);
  found.lesson.deleteOne();
  course.recalculateDuration();
  await course.save();
  sendSuccess(res, { course }, 'Lesson deleted');
});

export const uploadLessonVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Video file is required', 400);

  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const found = course.findLesson(req.params.lessonId);
  if (!found) throw new AppError('Lesson not found', 404);

  const storage = getStorage();
  const saved = await storage.saveUpload(req.file, path.join('videos', String(course._id)));
  const jobId = `video-${course._id}-${found.lesson._id}-${uuidv4()}`;

  found.lesson.video = {
    originalPath: saved.absolutePath,
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    storageKey: saved.key,
    status: 'pending',
    jobId,
  };

  await course.save();

  try {
    await enqueueVideoProcessing({
      jobId,
      courseId: course._id.toString(),
      lessonId: found.lesson._id.toString(),
      storageKey: saved.key,
    });
  } catch (err) {
    found.lesson.video.status = 'failed';
    found.lesson.video.processingError = `Queue unavailable: ${err.message}`;
    await course.save();
    throw new AppError('Failed to queue video processing. Ensure Redis is running.', 503);
  }

  sendSuccess(res, { lesson: found.lesson, deliveryMode: getDeliveryMode() }, 'Video uploaded and queued');
});

export const getLessonPlayback = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  const found = course.findLesson(req.params.lessonId);
  if (!found) throw new AppError('Lesson not found', 404);

  const isOwner =
    req.user.role === 'admin' || course.instructor.toString() === req.user._id.toString();
  const isPreview = found.lesson.isFreePreview;

  if (!isOwner && !isPreview) {
    await ensureEnrollment(req.user._id, course._id);
  }

  if (found.lesson.video?.status !== 'ready') {
    throw new AppError(`Video not ready (status: ${found.lesson.video?.status || 'none'})`, 409);
  }

  const url = getVideoDeliveryUrl({
    hlsKey: found.lesson.video.hlsKey,
    useSigned: true,
  });

  sendSuccess(res, {
    url,
    deliveryMode: getDeliveryMode(),
    status: found.lesson.video.status,
    durationSeconds: found.lesson.durationSeconds,
    lesson: {
      id: found.lesson._id,
      title: found.lesson.title,
      description: found.lesson.description,
    },
  });
});

export const enrollInCourse = asyncHandler(async (req, res) => {
  const enrollment = await enrollFree(req.user._id, req.params.id);
  sendSuccess(res, { enrollment }, 'Enrolled successfully');
});

export const getCourseForLearning = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name');
  if (!course) throw new AppError('Course not found', 404);

  const isOwner =
    req.user.role === 'admin' || course.instructor._id.toString() === req.user._id.toString();

  if (!isOwner) {
    await ensureEnrollment(req.user._id, course._id);
  }

  sendSuccess(res, { course });
});


export const uploadCourseThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Thumbnail required', 400);
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);

  const storage = getStorage();
  const saved = await storage.saveUpload(req.file, 'thumbnails');
  course.thumbnail = `/media/${saved.key}`;
  await course.save();
  sendSuccess(res, { course }, 'Thumbnail uploaded');
});

export const reorderSections = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  assertCourseOwner(course, req.user);
  const { sectionIds } = req.body;
  if (!Array.isArray(sectionIds)) throw new AppError('sectionIds array required', 400);

  sectionIds.forEach((id, index) => {
    const section = course.sections.id(id);
    if (section) section.order = index;
  });
  course.sections.sort((a, b) => a.order - b.order);
  await course.save();
  sendSuccess(res, { course }, 'Sections reordered');
});

export { storageRoot };
