import { Queue } from 'bullmq';
import { env } from '../config/env.js';

let videoQueue;

export function getVideoQueue() {
  if (!videoQueue) {
    videoQueue = new Queue('video-processing', {
      connection: {
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return videoQueue;
}

export async function enqueueVideoProcessing(payload) {
  const queue = getVideoQueue();
  const job = await queue.add('process-video', payload, {
    jobId: payload.jobId,
  });
  return job;
}
