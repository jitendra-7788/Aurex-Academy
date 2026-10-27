import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aurex Academy API',
      version: '1.0.0',
      description: 'Learning Management System with Live Classes — REST API',
    },
    servers: [{ url: env.apiUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [],
};

export const swaggerSpec = {
  ...swaggerJsdoc(options),
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register student or instructor',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'instructor'] },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login',
        tags: ['Auth'],
        security: [],
      },
    },
    '/api/courses': {
      get: { summary: 'List published courses', tags: ['Courses'], security: [] },
      post: { summary: 'Create course (instructor)', tags: ['Courses'] },
    },
    '/api/quizzes/{id}/submit': {
      post: { summary: 'Submit quiz answers for server-side grading', tags: ['Quizzes'] },
    },
    '/api/live-classes/{id}/join': {
      get: { summary: 'Get join info and ICE servers', tags: ['Live Classes'] },
    },
    '/api/certificates/verify/{code}': {
      get: { summary: 'Verify certificate', tags: ['Certificates'], security: [] },
    },
    '/api/payments/checkout/{courseId}': {
      post: { summary: 'Create Stripe test checkout session', tags: ['Payments'] },
    },
  },
};
