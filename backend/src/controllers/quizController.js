import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { Course } from '../models/Course.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ensureEnrollment } from '../services/enrollmentService.js';

function assertQuizOwner(quiz, user) {
  if (user.role === 'admin') return;
  if (quiz.instructor.toString() !== user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }
}

export const createQuiz = asyncHandler(async (req, res) => {
  if (!req.body.courseId) throw new AppError('Course ID is required', 400);
  const course = await Course.findById(req.body.courseId).catch(() => null);
  if (!course) throw new AppError('Course not found', 404);
  if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  const quiz = await Quiz.create({
    title: req.body.title,
    description: req.body.description || '',
    course: course._id,
    lesson: req.body.lessonId || null,
    instructor: course.instructor,
    questions: req.body.questions || [],
    passingScore: req.body.passingScore ?? 70,
    timeLimitMinutes: req.body.timeLimitMinutes ?? 0,
    maxAttempts: req.body.maxAttempts ?? 0,
    isPublished: Boolean(req.body.isPublished),
  });

  sendSuccess(res, { quiz }, 'Quiz created', 201);
});

export const updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);
  assertQuizOwner(quiz, req.user);

  [
    'title',
    'description',
    'questions',
    'passingScore',
    'timeLimitMinutes',
    'maxAttempts',
    'isPublished',
    'lesson',
  ].forEach((f) => {
    if (req.body[f] !== undefined) quiz[f] = req.body[f];
  });
  await quiz.save();
  sendSuccess(res, { quiz }, 'Quiz updated');
});

export const listCourseQuizzes = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const isStaff =
    req.user.role === 'admin' ||
    (await Course.exists({ _id: courseId, instructor: req.user._id }));

  if (!isStaff) {
    await ensureEnrollment(req.user._id, courseId);
  }

  const quizzes = await Quiz.find({
    course: courseId,
    ...(isStaff ? {} : { isPublished: true }),
  }).sort({ createdAt: -1 });

  const data = isStaff ? quizzes : quizzes.map((q) => q.toStudentView());
  sendSuccess(res, { quizzes: data });
});

export const getQuizForAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.isPublished) throw new AppError('Quiz not found', 404);
  await ensureEnrollment(req.user._id, quiz.course);

  if (quiz.maxAttempts > 0) {
    const count = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
    if (count >= quiz.maxAttempts) {
      throw new AppError('Maximum attempts reached', 403);
    }
  }

  sendSuccess(res, { quiz: quiz.toStudentView() });
});

export const submitQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.isPublished) throw new AppError('Quiz not found', 404);
  await ensureEnrollment(req.user._id, quiz.course);

  if (quiz.maxAttempts > 0) {
    const count = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
    if (count >= quiz.maxAttempts) {
      throw new AppError('Maximum attempts reached', 403);
    }
  }

  const answersInput = Array.isArray(req.body.answers) ? req.body.answers : [];
  let score = 0;
  let maxScore = 0;
  const graded = [];

  for (const question of quiz.questions) {
    maxScore += question.points;
    const answer = answersInput.find(
      (a) => String(a.questionId) === String(question._id)
    );
    const selected = answer
      ? question.options.id(answer.selectedOptionId)
      : null;
    const isCorrect = Boolean(selected?.isCorrect);
    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;
    graded.push({
      questionId: question._id,
      selectedOptionId: selected?._id || answer?.selectedOptionId,
      isCorrect,
      pointsEarned,
      correctOptionId: question.options.find((o) => o.isCorrect)?._id,
      explanation: question.explanation,
    });
  }

  const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
  const passed = percentage >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: req.user._id,
    course: quiz.course,
    answers: graded.map(({ questionId, selectedOptionId, isCorrect, pointsEarned }) => ({
      questionId,
      selectedOptionId,
      isCorrect,
      pointsEarned,
    })),
    score,
    maxScore,
    percentage,
    passed,
    submittedAt: new Date(),
  });

  sendSuccess(res, {
    attempt: {
      id: attempt._id,
      score,
      maxScore,
      percentage,
      passed,
      passingScore: quiz.passingScore,
      submittedAt: attempt.submittedAt,
      feedback: graded,
    },
  }, 'Quiz submitted');
});

export const getMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    ...(req.query.quizId ? { quiz: req.query.quizId } : {}),
    ...(req.query.courseId ? { course: req.query.courseId } : {}),
  })
    .sort({ createdAt: -1 })
    .populate('quiz', 'title passingScore');
  sendSuccess(res, { attempts });
});

export const getQuizResultsForInstructor = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new AppError('Quiz not found', 404);
  assertQuizOwner(quiz, req.user);
  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate('student', 'name email')
    .sort({ createdAt: -1 });
  sendSuccess(res, { attempts });
});
