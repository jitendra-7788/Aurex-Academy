import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient;

export function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }
  return redisClient;
}

export async function connectRedis() {
  const client = getRedis();
  if (client.status === 'wait' || client.status === 'end') {
    await client.connect();
  }
  return client;
}
