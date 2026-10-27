import { Worker } from 'bullmq';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { Course } from '../models/Course.js';
import { processToHls } from '../services/ffmpegService.js';
import { getStorage } from '../services/storage/index.js';

async function start() {
  await connectDB();
  console.log('Video worker starting...');

  const worker = new Worker(
    'video-processing',
    async (job) => {
      const { courseId, lessonId, storageKey } = job.data;
      console.log(`Processing video job ${job.id} for lesson ${lessonId}`);

      const course = await Course.findById(courseId);
      if (!course) throw new Error('Course not found');
      const found = course.findLesson(lessonId);
      if (!found) throw new Error('Lesson not found');

      const { lesson } = found;
      lesson.video.status = 'processing';
      lesson.video.processingError = undefined;
      await course.save();

      const storage = getStorage();
      const inputPath = storage.resolve(storageKey);

      try {
        const result = await processToHls({
          inputPath,
          courseId,
          lessonId,
        });

        lesson.video.status = 'ready';
        lesson.video.hlsPath = result.hlsPath;
        lesson.video.hlsKey = result.hlsKey;
        lesson.video.processedAt = new Date();
        if (result.durationSeconds) {
          lesson.durationSeconds = result.durationSeconds;
        }
        course.recalculateDuration();
        await course.save();
        console.log(`Video ready for lesson ${lessonId}`);
        return { hlsKey: result.hlsKey, durationSeconds: result.durationSeconds };
      } catch (err) {
        lesson.video.status = 'failed';
        lesson.video.processingError = err.message;
        await course.save();
        throw err;
      }
    },
    {
      connection: {
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
      },
      concurrency: 1,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  console.log('Video worker listening for jobs');
}

start().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
