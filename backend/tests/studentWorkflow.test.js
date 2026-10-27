import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Quiz } from '../src/models/Quiz.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { LiveClass } from '../src/models/LiveClass.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { COURSES_SEED_DATA } from '../src/utils/seed.js';
import { v4 as uuidv4 } from 'uuid';

let mongo;
let app;
let instructor;
let student;
let instructorToken;
let studentToken;
let unenrolledStudent;
let unenrolledToken;
let seededCourses = [];
let sampleQuiz;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  instructor = await User.create({
    name: 'Master Educator',
    email: 'educator@test.local',
    password: 'Instructor123!',
    role: 'instructor',
    instructorApproved: true,
  });

  student = await User.create({
    name: 'Jane Doe',
    email: 'jane@student.local',
    password: 'Student123!',
    role: 'student',
  });

  unenrolledStudent = await User.create({
    name: 'Bob Unenrolled',
    email: 'bob@student.local',
    password: 'Student123!',
    role: 'student',
  });

  studentToken = signAccessToken(student);
  instructorToken = signAccessToken(instructor);
  unenrolledToken = signAccessToken(unenrolledStudent);

  // Seed all 6 courses
  for (const courseDef of COURSES_SEED_DATA) {
    const course = await Course.create({
      title: courseDef.title,
      shortDescription: courseDef.shortDescription,
      description: courseDef.description,
      category: courseDef.category,
      level: courseDef.level,
      price: courseDef.price,
      isFree: true,
      status: 'published',
      publishedAt: new Date(),
      instructor: instructor._id,
      learningObjectives: courseDef.learningObjectives,
      prerequisites: courseDef.prerequisites,
      sections: courseDef.sections,
    });
    course.recalculateDuration();
    await course.save();
    seededCourses.push(course);

    if (courseDef.quiz) {
      const q = await Quiz.create({
        title: courseDef.quiz.title,
        description: courseDef.quiz.description,
        course: course._id,
        instructor: instructor._id,
        passingScore: courseDef.quiz.passingScore,
        isPublished: true,
        questions: courseDef.quiz.questions,
      });
      if (!sampleQuiz) sampleQuiz = q;
    }
  }

  // Seed a live class for course 0
  await LiveClass.create({
    title: 'Live Workshop & Q&A',
    description: 'Interactive session',
    course: seededCourses[0]._id,
    instructor: instructor._id,
    scheduledStart: new Date(Date.now() + 86400000),
    durationMinutes: 60,
    status: 'scheduled',
    roomId: `room-${uuidv4()}`,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Student Experience & Complete Workflow', () => {
  it('catalog returns all 6 published courses', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(6);
  });

  it('filters courses by category accurately', async () => {
    const res = await request(app).get('/api/courses?category=Programming');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Python Programming for Beginners');
  });

  it('filters courses by difficulty level', async () => {
    const res = await request(app).get('/api/courses?level=intermediate');
    expect(res.status).toBe(200);
    const titles = res.body.data.map((c) => c.title);
    expect(titles).toContain('Data Analytics with Python');
    expect(titles).toContain('React.js Frontend Development');
    expect(titles.length).toBe(2);
  });

  it('filters courses by price free', async () => {
    const res = await request(app).get('/api/courses?price=free');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(6);
  });

  it('searches courses by keyword across title and description', async () => {
    const res = await request(app).get('/api/courses?q=Agentic');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Generative AI and Agentic AI Fundamentals');
  });

  it('applies combined filters together', async () => {
    const res = await request(app).get(
      '/api/courses?category=Web Development&level=intermediate&price=free'
    );
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('React.js Frontend Development');
  });

  it('returns empty array when no courses match search', async () => {
    const res = await request(app).get('/api/courses?q=NonExistentSkillXYZ');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('retrieves course details by slug with full curriculum', async () => {
    const slug = seededCourses[0].slug;
    const res = await request(app).get(`/api/courses/slug/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.course.title).toBe('Introduction to Full-Stack Web Development');
    expect(res.body.data.course.sections.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.enrolled).toBe(false);
  });

  it('enrolls a student into a free course and prevents duplicates', async () => {
    const courseId = seededCourses[0]._id;

    // First enrollment
    const res1 = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.enrollment.status).toBe('active');

    // Duplicate enrollment attempt
    const res2 = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.enrollment.status).toBe('active');

    // Verify only 1 document in MongoDB
    const count = await Enrollment.countDocuments({
      student: student._id,
      course: courseId,
    });
    expect(count).toBe(1);
  });

  it('enrolled student can access course learning view, but unenrolled student is blocked', async () => {
    const courseId = seededCourses[0]._id;

    // Enrolled student succeeds
    const okRes = await request(app)
      .get(`/api/courses/${courseId}/learning`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(okRes.status).toBe(200);

    // Unenrolled student gets 403 Forbidden
    const blockedRes = await request(app)
      .get(`/api/courses/${courseId}/learning`)
      .set('Authorization', `Bearer ${unenrolledToken}`);
    expect(blockedRes.status).toBe(403);
  });

  it('student can update lesson progress and complete course', async () => {
    const course = seededCourses[0];
    const lessonId = course.sections[0].lessons[0]._id;

    const res = await request(app)
      .post(`/api/progress/course/${course._id}/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ watchedSeconds: 300, completed: true });

    expect(res.status).toBe(200);
    expect(res.body.data.progress.completed).toBe(true);
    expect(res.body.data.enrollment.progressPercent).toBeGreaterThan(0);
  });

  it('shows instructor-created published quizzes and upcoming classes to enrolled students', async () => {
    const course = seededCourses[0];
    const quizResponse = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        courseId: course._id,
        title: 'Instructor Workflow Quiz',
        isPublished: true,
        questions: [{
          prompt: 'Which option is correct?',
          options: [
            { text: 'Correct', isCorrect: true },
            { text: 'Incorrect', isCorrect: false },
          ],
        }],
      });
    expect(quizResponse.status).toBe(201);

    const draftResponse = await request(app)
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        courseId: course._id,
        title: 'Instructor Workflow Draft',
        isPublished: false,
        questions: [],
      });
    expect(draftResponse.status).toBe(201);

    const classResponse = await request(app)
      .post('/api/live-classes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        courseId: course._id,
        title: 'Instructor Workflow Live Class',
        scheduledStart: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
      });
    expect(classResponse.status).toBe(201);

    // Submit an attempt on the sample quiz
    await request(app)
      .post(`/api/quizzes/${sampleQuiz._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          {
            questionId: sampleQuiz.questions[0]._id,
            selectedOptionId: sampleQuiz.questions[0].options[0]._id,
          },
        ],
      });

    const res = await request(app)
      .get('/api/progress/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.enrollments.length).toBe(1);
    expect(res.body.data.continueLearning.length).toBe(1);
    expect(res.body.data.upcomingClasses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: classResponse.body.data.liveClass._id }),
      ])
    );
    expect(res.body.data.recentQuizzes.length).toBe(1);
    expect(res.body.data.recentQuizzes[0].percentage).toBeGreaterThanOrEqual(0);
    expect(res.body.data.publishedQuizzes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: quizResponse.body.data.quiz._id,
          title: 'Instructor Workflow Quiz',
          course: expect.objectContaining({ _id: String(course._id) }),
        }),
      ])
    );
    expect(res.body.data.publishedQuizzes.map((quiz) => quiz.title)).not.toContain(
      'Instructor Workflow Draft'
    );
    expect(res.body.data.publishedQuizzes[0].questions[0].options[0].isCorrect).toBeUndefined();

    const quizAttemptView = await request(app)
      .get(`/api/quizzes/${quizResponse.body.data.quiz._id}/attempt`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(quizAttemptView.status).toBe(200);

    const joinInfo = await request(app)
      .get(`/api/live-classes/${classResponse.body.data.liveClass._id}/join`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(joinInfo.status).toBe(200);
    expect(joinInfo.body.data.role).toBe('student');

    const unenrolledDashboard = await request(app)
      .get('/api/progress/dashboard')
      .set('Authorization', `Bearer ${unenrolledToken}`);
    expect(unenrolledDashboard.status).toBe(200);
    expect(unenrolledDashboard.body.data.publishedQuizzes).toHaveLength(0);
    expect(unenrolledDashboard.body.data.upcomingClasses).toHaveLength(0);
  });
});
