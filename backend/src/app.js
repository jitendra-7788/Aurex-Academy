import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env, storageRoot } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { handleStripeWebhook } from './controllers/paymentController.js';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import liveClassRoutes from './routes/liveClassRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (origin === env.clientUrl) return true;
    if (!env.isProd && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return true;
    }
    return false;
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS origin '${origin}' not allowed`));
        }
      },
      credentials: true,
    })
  );
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(cookieParser());

  // Stripe webhook needs raw body
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      message: 'Aurex Academy API healthy',
      deliveryMode: env.videoDelivery,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/media', express.static(storageRoot, {
    fallthrough: true,
    setHeaders(res) {
      res.setHeader('Access-Control-Allow-Origin', env.clientUrl);
    },
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/live-classes', liveClassRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/instructor', instructorRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
