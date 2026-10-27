import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { signAccessToken } from '../src/services/tokenService.js';

let mongo;
let app;
let instructor;
let student;
let instructorToken;
let studentToken;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  instructor = await User.create({
    name: 'Course Instructor',
    email: 'inst@test.local',
    password: 'Instructor123!',
    role: 'instructor',
    instructorApproved: true,
  });

  student = await User.create({
    name: 'Course Student',
    email: 'stud@test.local',
    password: 'Student123!',
    role: 'student',
  });

  instructorToken = signAccessToken(instructor);
  studentToken = signAccessToken(student);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Courses & Sections & Enrollment', () => {
  let createdCourseId;
  let sectionId;

  it('allows an approved instructor to create a draft course', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Mastering JavaScript Testing',
        shortDescription: 'From Jest to integration tests',
        description: 'Comprehensive course covering everything from unit tests to end-to-end testing.',
        category: 'Web Development',
        level: 'intermediate',
        price: 0,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.course.status).toBe('draft');
    createdCourseId = res.body.data.course._id;
  });

  it('allows adding sections and lessons to the course', async () => {
    const secRes = await request(app)
      .post(`/api/courses/${createdCourseId}/sections`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Module 1: Foundations' });

    expect(secRes.status).toBe(201);
    expect(secRes.body.data.course.sections.length).toBe(1);
    sectionId = secRes.body.data.course.sections[0]._id;

    const lesRes = await request(app)
      .post(`/api/courses/${createdCourseId}/sections/${sectionId}/lessons`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Introduction to Jest',
        description: 'How Jest works and writing first test',
        isFreePreview: true,
      });

    expect(lesRes.status).toBe(201);
    expect(lesRes.body.data.course.sections[0].lessons.length).toBe(1);
  });

  it('submits course for review / publish', async () => {
    const res = await request(app)
      .post(`/api/courses/${createdCourseId}/publish`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    // Since instructor is not admin, it transitions to pending_review
    expect(['pending_review', 'published']).toContain(res.body.data.course.status);

    // Make it published for student testing
    await Course.findByIdAndUpdate(createdCourseId, { status: 'published', isFree: true });
  });

  it('allows a student to enroll in a free published course', async () => {
    const res = await request(app)
      .post(`/api/courses/${createdCourseId}/enroll`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.enrollment.status).toBe('active');

    const enrollment = await Enrollment.findOne({ student: student._id, course: createdCourseId });
    expect(enrollment).not.toBeNull();
  });

  it('allows student to fetch course for learning when enrolled', async () => {
    const res = await request(app)
      .get(`/api/courses/${createdCourseId}/learning`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.course._id).toBe(createdCourseId);
    expect(res.body.data.course.sections.length).toBe(1);
  });
});
