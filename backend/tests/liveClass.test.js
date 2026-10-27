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
let course;
let instructorToken;
let studentToken;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  instructor = await User.create({
    name: 'Live Instructor',
    email: 'liveinst@test.local',
    password: 'Instructor123!',
    role: 'instructor',
    instructorApproved: true,
  });

  student = await User.create({
    name: 'Live Student',
    email: 'livestud@test.local',
    password: 'Student123!',
    role: 'student',
  });

  course = await Course.create({
    title: 'Real-time Web Development',
    shortDescription: 'WebRTC and Sockets',
    description: 'Build real-time interactive apps.',
    category: 'Full-Stack',
    price: 0,
    status: 'published',
    instructor: instructor._id,
  });

  instructorToken = signAccessToken(instructor);
  studentToken = signAccessToken(student);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Live Classes & Signaling preparation', () => {
  let liveClassId;

  it('allows instructor to schedule a live class', async () => {
    const res = await request(app)
      .post('/api/live-classes')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        courseId: course._id,
        title: 'Q&A & Live Coding Session',
        description: 'Bring your questions regarding WebRTC',
        scheduledStart: new Date(Date.now() + 3600000).toISOString(),
        durationMinutes: 45,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.liveClass.roomId).toBeDefined();
    liveClassId = res.body.data.liveClass._id;
  });

  it('blocks unenrolled student from retrieving live join info', async () => {
    const res = await request(app)
      .get(`/api/live-classes/${liveClassId}/join`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('allows enrolled student to retrieve live join info with iceServers', async () => {
    await Enrollment.create({
      student: student._id,
      course: course._id,
      status: 'active',
    });

    const res = await request(app)
      .get(`/api/live-classes/${liveClassId}/join`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('student');
    expect(res.body.data.roomId).toBeDefined();
    expect(Array.isArray(res.body.data.iceServers)).toBe(true);
    expect(res.body.data.iceServers.length).toBeGreaterThanOrEqual(1);
  });
});
