import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth', () => {
  it('registers a student and returns access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'Student123!',
      role: 'student',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('student');
  });

  it('rejects login with wrong password', async () => {
    await User.create({
      name: 'Test',
      email: 'a@test.com',
      password: 'Student123!',
      role: 'student',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'a@test.com',
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('does not allow registering as admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker',
      email: 'h@test.com',
      password: 'Hacker123!',
      role: 'admin',
    });
    expect(res.status).toBe(400);
  });
});
