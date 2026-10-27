import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { env } from './config/env.js';
import { initSocket } from './services/socketService.js';
import { checkFfmpegAvailable } from './services/ffmpegService.js';
import { getDeliveryMode } from './services/videoDelivery.js';

async function bootstrap() {
  await connectDB();

  try {
    await connectRedis();
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis not available yet:', err.message);
    console.warn('Video queueing will fail until Redis is running (docker compose up -d)');
  }

  const ffmpegOk = await checkFfmpegAvailable();
  console.log(`FFmpeg available: ${ffmpegOk}`);
  console.log(`Video delivery mode: ${getDeliveryMode()}`);

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.clientUrl || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      },
      credentials: true,
    },
  });
  initSocket(io);
  app.set('io', io);

  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Swagger docs: http://localhost:${env.port}/api/docs`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
