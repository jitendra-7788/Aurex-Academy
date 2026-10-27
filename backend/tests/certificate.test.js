import request from 'supertest';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { LessonProgress } from '../src/models/LessonProgress.js';
import { Certificate } from '../src/models/Certificate.js';
import { issueCertificate } from '../src/services/certificateService.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { storageRoot } from '../src/config/env.js';

let mongo;
let app;
let student;
let instructor;
let course;
let studentToken;
let generatedCertificatePath;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  instructor = await User.create({
    name: 'Cert Instructor',
    email: 'certinst@test.local',
    password: 'Instructor123!',
    role: 'instructor',
    instructorApproved: true,
  });

  student = await User.create({
    name: 'Alice Scholar',
    email: 'alice@test.local',
    password: 'Student123!',
    role: 'student',
  });

  course = await Course.create({
    title: 'Certified Node.js Architecture',
    shortDescription: 'Master architecture',
    description: 'Learn scalable backend design patterns.',
    category: 'Backend',
    price: 0,
    status: 'published',
    instructor: instructor._id,
    sections: [
      {
        title: 'Core Concepts',
        order: 0,
        lessons: [{ title: 'Lesson 1', order: 0 }],
      },
    ],
  });

  studentToken = signAccessToken(student);
});

afterAll(async () => {
  if (generatedCertificatePath && fs.existsSync(generatedCertificatePath)) {
    fs.unlinkSync(generatedCertificatePath);
  }
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Certificates', () => {
  it('rejects certificate request when course completion requirements are not met', async () => {
    await Enrollment.create({
      student: student._id,
      course: course._id,
      status: 'active',
      progressPercent: 50,
    });

    const res = await request(app)
      .post(`/api/certificates/course/${course._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(400);
  });

  it('generates a PDF certificate on disk when completion requirements are met', async () => {
    const lessonId = course.sections[0].lessons[0]._id;
    await LessonProgress.create({
      student: student._id,
      course: course._id,
      lesson: lessonId,
      completed: true,
      watchedSeconds: 300,
    });

    await Enrollment.findOneAndUpdate(
      { student: student._id, course: course._id },
      { status: 'completed', progressPercent: 100 }
    );

    const res = await request(app)
      .post(`/api/certificates/course/${course._id}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.certificate.verificationCode).toBeDefined();

    generatedCertificatePath = path.join(storageRoot, res.body.data.certificate.filePath);
    expect(fs.existsSync(generatedCertificatePath)).toBe(true);

    // Verify via public verification endpoint
    const verifyRes = await request(app).get(
      `/api/certificates/verify/${res.body.data.certificate.verificationCode}`
    );
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.studentName).toBe('Alice Scholar');
    expect(verifyRes.body.data.courseTitle).toBe('Certified Node.js Architecture');
  });
});
