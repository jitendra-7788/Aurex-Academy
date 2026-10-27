import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../src/models/User.js';
import { Course } from '../src/models/Course.js';
import { Quiz } from '../src/models/Quiz.js';
import { Enrollment } from '../src/models/Enrollment.js';
import { createApp } from '../src/app.js';
import request from 'supertest';
import { signAccessToken } from '../src/services/tokenService.js';

let mongo;
let app;
let student;
let quiz;
let token;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();

  const instructor = await User.create({
    name: 'Inst',
    email: 'i@test.com',
    password: 'Instructor123!',
    role: 'instructor',
    instructorApproved: true,
  });
  student = await User.create({
    name: 'Stu',
    email: 's@test.com',
    password: 'Student123!',
    role: 'student',
  });
  const course = await Course.create({
    title: 'Test Course',
    shortDescription: 'Short',
    description: 'Long description here',
    category: 'Test',
    instructor: instructor._id,
    status: 'published',
    price: 0,
    sections: [{ title: 'S1', order: 0, lessons: [{ title: 'L1', order: 0 }] }],
  });
  await Enrollment.create({ student: student._id, course: course._id });
  quiz = await Quiz.create({
    title: 'Q1',
    course: course._id,
    instructor: instructor._id,
    isPublished: true,
    passingScore: 50,
    questions: [
      {
        prompt: '2+2?',
        options: [
          { text: '4', isCorrect: true },
          { text: '5', isCorrect: false },
        ],
        points: 1,
      },
    ],
  });
  token = signAccessToken(student);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Quiz grading', () => {
  it('grades correctly on the server and hides correct answers before submit', async () => {
    const view = await request(app)
      .get(`/api/quizzes/${quiz._id}/attempt`)
      .set('Authorization', `Bearer ${token}`);
    expect(view.status).toBe(200);
    const options = view.body.data.quiz.questions[0].options;
    expect(options[0].isCorrect).toBeUndefined();

    const submit = await request(app)
      .post(`/api/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        answers: [
          {
            questionId: quiz.questions[0]._id,
            selectedOptionId: quiz.questions[0].options[0]._id,
          },
        ],
      });
    expect(submit.status).toBe(200);
    expect(submit.body.data.attempt.passed).toBe(true);
    expect(submit.body.data.attempt.percentage).toBe(100);
  });
});
